import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8'),
);

/**
 * These tests guard the packaging contract the ESM migration introduced: the
 * emitted entry points must exist where package.json advertises them, relative
 * specifiers must keep their extensions, and the entry must actually load in a
 * real Node process rather than only under vitest's resolver.
 */
describe('ESM packaging', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'ignore',
    });
  }, 120_000);

  it('declares itself as an ES module', () => {
    expect(packageJson.type).toBe('module');
  });

  it('points main, types and exports at files that exist', async () => {
    const targets = [
      packageJson.main,
      packageJson.types,
      packageJson.exports['.'].types,
      packageJson.exports['.'].default,
    ];

    for (const target of targets) {
      expect(target).toBeTypeOf('string');
      await expect(
        access(resolve(projectRoot, target)),
      ).resolves.toBeUndefined();
    }
  });

  it('emits relative specifiers with explicit .js extensions', () => {
    const entry = readFileSync(join(distDir, 'index.js'), 'utf8');
    const specifiers = [...entry.matchAll(/from\s+'(\.[^']*)'/g)].map(
      m => m[1],
    );

    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier).toMatch(/\.js$/);
    }
  });

  it('loads the built entry point in a real Node ESM context', async () => {
    const entry = pathToFileURL(join(distDir, 'index.js')).href;
    const loaded = await import(/* @vite-ignore */ entry);

    expect(Object.keys(loaded).sort()).toEqual(['HttpModule', 'HttpService']);
    expect(typeof loaded.HttpModule.register).toBe('function');
    expect(typeof loaded.HttpModule.registerAsync).toBe('function');
  });

  it('resolves the entry through Node without vitest in the loop', () => {
    const script = `
      const { HttpModule, HttpService } = await import(${JSON.stringify(
        pathToFileURL(join(distDir, 'index.js')).href,
      )});
      const dynamic = HttpModule.register({ baseURL: 'https://example.com' });
      if (typeof HttpService !== 'function') throw new Error('HttpService missing');
      if (dynamic.module !== HttpModule) throw new Error('bad dynamic module');
      console.log('ok');
    `;

    const output = execFileSync(
      process.execPath,
      ['--input-type=module', '--eval', script],
      { cwd: projectRoot, encoding: 'utf8' },
    );

    expect(output.trim()).toBe('ok');
  });
});
