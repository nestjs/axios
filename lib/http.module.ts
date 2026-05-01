import { DynamicModule, Module, Provider } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import Axios from 'axios';
import {
  AXIOS_INSTANCE_TOKEN,
  HTTP_MODULE_ID,
  HTTP_MODULE_OPTIONS,
} from './http.constants.js';
import { HttpService } from './http.service.js';
import {
  HttpModuleAsyncOptions,
  HttpModuleOptions,
  HttpModuleOptionsFactory,
} from './interfaces/index.js';

const randomStringGenerator = () => randomBytes(16).toString('base64url').slice(0, 21);

/**
 * @publicApi
 */
@Module({
  providers: [
    HttpService,
    {
      provide: AXIOS_INSTANCE_TOKEN,
      useValue: Axios,
    },
  ],
  exports: [HttpService],
})
export class HttpModule {
  static register(config: HttpModuleOptions): DynamicModule {
    return {
      module: HttpModule,
      global: config.global,
      providers: [
        {
          provide: AXIOS_INSTANCE_TOKEN,
          useValue: Axios.create(config),
        },
        {
          provide: HTTP_MODULE_ID,
          useValue: randomStringGenerator(),
        },
      ],
    };
  }

  static registerAsync(options: HttpModuleAsyncOptions): DynamicModule {
    return {
      module: HttpModule,
      global: options.global,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: AXIOS_INSTANCE_TOKEN,
          useFactory: (config: HttpModuleOptions) => Axios.create(config),
          inject: [HTTP_MODULE_OPTIONS],
        },
        {
          provide: HTTP_MODULE_ID,
          useValue: randomStringGenerator(),
        },
        ...(options.extraProviders || []),
      ],
    };
  }

  private static createAsyncProviders(
    options: HttpModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: HttpModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: HTTP_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: HTTP_MODULE_OPTIONS,
      useFactory: async (optionsFactory: HttpModuleOptionsFactory) =>
        optionsFactory.createHttpOptions(),
      inject: [options.useExisting ?? options.useClass!],
    };
  }
}
