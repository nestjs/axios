import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { HttpModule, HttpService } from '../lib/index.js';
import {
  AXIOS_INSTANCE_TOKEN,
  HTTP_MODULE_ID,
  HTTP_MODULE_OPTIONS,
} from '../lib/http.constants.js';
import type { HttpModuleOptionsFactory } from '../lib/index.js';

@Injectable()
class ConfigService {
  readonly baseURL = 'https://from-config-service.example';
}

@Injectable()
class HttpConfigFactory implements HttpModuleOptionsFactory {
  createHttpOptions() {
    return { baseURL: 'https://from-factory-class.example', timeout: 1234 };
  }
}

@Module({
  providers: [ConfigService, HttpConfigFactory],
  exports: [ConfigService, HttpConfigFactory],
})
class ConfigModule {}

describe('HttpModule', () => {
  const modules: { close: () => Promise<unknown> }[] = [];

  const compile = async (
    metadata: Parameters<typeof Test.createTestingModule>[0],
  ) => {
    const moduleRef = await Test.createTestingModule(metadata).compile();
    modules.push(moduleRef);
    return moduleRef;
  };

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(m => m.close()));
  });

  describe('register', () => {
    it('exposes an HttpService whose axios instance carries the config', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.register({
            baseURL: 'https://example.com',
            timeout: 4200,
          }),
        ],
      });

      const service = moduleRef.get(HttpService);

      expect(service).toBeInstanceOf(HttpService);
      expect(service.axiosRef.defaults.baseURL).toBe('https://example.com');
      expect(service.axiosRef.defaults.timeout).toBe(4200);
    });

    it('creates a dedicated axios instance rather than reusing the default export', async () => {
      const first = await compile({
        imports: [HttpModule.register({ baseURL: 'https://one.example' })],
      });
      const second = await compile({
        imports: [HttpModule.register({ baseURL: 'https://two.example' })],
      });

      const a = first.get(HttpService).axiosRef;
      const b = second.get(HttpService).axiosRef;

      expect(a).not.toBe(b);
      expect(a.defaults.baseURL).toBe('https://one.example');
      expect(b.defaults.baseURL).toBe('https://two.example');
    });

    it('assigns a distinct module id per registration', () => {
      const ids = new Set(
        Array.from({ length: 50 }, () => {
          const provider = HttpModule.register({}).providers!.find(
            (p: any) => p.provide === HTTP_MODULE_ID,
          ) as { useValue: string };
          return provider.useValue;
        }),
      );

      expect(ids.size).toBe(50);
      for (const id of ids) {
        expect(id).toHaveLength(21);
        expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });

    it('honours the global flag', () => {
      expect(HttpModule.register({ global: true }).global).toBe(true);
      expect(HttpModule.register({}).global).toBeUndefined();
    });
  });

  describe('registerAsync', () => {
    it('supports useFactory with injected dependencies', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              baseURL: config.baseURL,
            }),
          }),
        ],
      });

      expect(moduleRef.get(HttpService).axiosRef.defaults.baseURL).toBe(
        'https://from-config-service.example',
      );
    });

    it('supports an async useFactory', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.registerAsync({
            useFactory: async () => ({ baseURL: 'https://async.example' }),
          }),
        ],
      });

      expect(moduleRef.get(HttpService).axiosRef.defaults.baseURL).toBe(
        'https://async.example',
      );
    });

    it('supports useClass', async () => {
      const moduleRef = await compile({
        imports: [HttpModule.registerAsync({ useClass: HttpConfigFactory })],
      });

      const defaults = moduleRef.get(HttpService).axiosRef.defaults;
      expect(defaults.baseURL).toBe('https://from-factory-class.example');
      expect(defaults.timeout).toBe(1234);
    });

    it('supports useExisting', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.registerAsync({
            imports: [ConfigModule],
            useExisting: HttpConfigFactory,
          }),
        ],
      });

      expect(moduleRef.get(HttpService).axiosRef.defaults.baseURL).toBe(
        'https://from-factory-class.example',
      );
    });

    it('registers extraProviders', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.registerAsync({
            useFactory: () => ({}),
            extraProviders: [{ provide: 'EXTRA', useValue: 'extra-value' }],
          }),
        ],
      });

      expect(moduleRef.get('EXTRA')).toBe('extra-value');
    });

    it('resolves the options token before the axios instance', async () => {
      const moduleRef = await compile({
        imports: [
          HttpModule.registerAsync({
            useFactory: () => ({ timeout: 999 }),
          }),
        ],
      });

      expect(moduleRef.get(HTTP_MODULE_OPTIONS)).toEqual({ timeout: 999 });
      expect(moduleRef.get(AXIOS_INSTANCE_TOKEN).defaults.timeout).toBe(999);
    });

    it('honours the global flag', () => {
      expect(
        HttpModule.registerAsync({ global: true, useFactory: () => ({}) })
          .global,
      ).toBe(true);
    });
  });
});
