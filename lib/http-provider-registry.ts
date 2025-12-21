import { HttpProvider, HttpProviderFactory } from './interfaces';
import { KyProviderFactory, AxiosProviderFactory } from './factories';

export class HttpProviderRegistry {
  private static factories: Map<HttpProvider, HttpProviderFactory> = new Map<
    HttpProvider,
    HttpProviderFactory
  >([
    ['ky' as HttpProvider, new KyProviderFactory()],
    ['axios' as HttpProvider, new AxiosProviderFactory()],
  ]);

  static register(provider: HttpProvider, factory: HttpProviderFactory): void {
    this.factories.set(provider, factory);
  }

  static getFactory(provider: HttpProvider = 'axios'): HttpProviderFactory {
    const factory = this.factories.get(provider);

    if (!factory) {
      throw new Error(
        `Unknown HTTP provider: ${provider}. Available providers: ${Array.from(this.factories.keys()).join(', ')}`,
      );
    }

    return factory;
  }
}
