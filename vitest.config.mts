import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The root tsconfig excludes tests/, so the transformer never picks up
  // experimentalDecorators for spec files. Enable them explicitly.
  oxc: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  test: {
    root: '.',
    include: ['tests/**/*.spec.ts'],
  },
});
