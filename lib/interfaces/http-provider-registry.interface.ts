import { Provider } from '@nestjs/common';

/**
 * Factory interface for creating HTTP provider instances and providers
 */
export interface HttpProviderFactory {
  /**
   * Creates an instance of the HTTP client with the given configuration
   */
  createInstance(config: any): any;

  /**
   * Creates the NestJS providers for the HTTP service
   */
  createProvider(config: any): Provider[];
}
