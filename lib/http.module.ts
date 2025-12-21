import {
  HTTP_MODULE_ID,
  HTTP_MODULE_OPTIONS,
  AXIOS_INSTANCE_TOKEN,
  KY_INSTANCE_TOKEN,
} from './http.constants';
import { HttpService } from './http.service';
import {
  HttpModuleOptions,
  AxiosHttpModuleOptions,
  HttpModuleAsyncOptions,
  HttpModuleOptionsFactory,
  AxiosHttpModuleAsyncOptions,
} from './interfaces';
import { KyProvider } from './providers/ky.provider';
import { AxiosProvider } from './providers/axios.provider';
import { HttpProviderRegistry } from './http-provider-registry';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

/**
 * @publicApi
 */
@Module({})
export class HttpModule {
  static register<T extends HttpModuleOptions = AxiosHttpModuleOptions>(
    config: T,
  ): DynamicModule {
    const { provider = 'axios', global, ...providerConfig } = config;

    const factory = HttpProviderRegistry.getFactory(provider);

    return {
      module: HttpModule,
      global: global,
      providers: [
        ...factory.createProvider(providerConfig),
        {
          provide: HTTP_MODULE_ID,
          useValue: randomStringGenerator(),
        },
      ],
    };
  }

  static registerAsync<
    T extends HttpModuleAsyncOptions = AxiosHttpModuleAsyncOptions,
  >(options: T): DynamicModule {
    const provider = options.provider || 'axios';
    const factory = HttpProviderRegistry.getFactory(provider);

    const instanceTokenMap = {
      ky: KY_INSTANCE_TOKEN,
      axios: AXIOS_INSTANCE_TOKEN,
    };

    const providerClassMap = {
      ky: KyProvider,
      axios: AxiosProvider,
    };

    const instanceToken = instanceTokenMap[provider];
    const providerClass = providerClassMap[provider];

    return {
      module: HttpModule,
      global: options.global,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: instanceToken,
          useFactory: (config: HttpModuleOptions) => {
            const { provider: _, ...providerConfig } = config;
            return factory.createInstance(providerConfig);
          },
          inject: [HTTP_MODULE_OPTIONS],
        },
        providerClass,
        {
          provide: HttpService,
          useClass: providerClass,
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
        provide: options.useClass,
        useClass: options.useClass,
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
      inject: [options.useExisting || options.useClass],
    };
  }
}
