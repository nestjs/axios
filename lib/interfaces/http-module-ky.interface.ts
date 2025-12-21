import {
  Type,
  Provider,
  ModuleMetadata,
  FactoryProvider,
} from '@nestjs/common';
import { Options } from 'ky';

interface BaseHttpModuleOptions {
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
}

export type KyHttpModuleOptions = Options &
  BaseHttpModuleOptions & {
    provider: 'ky';
  };

/**
 * @publicApi
 */
export interface KyHttpModuleOptionsFactory {
  createHttpOptions(): Promise<KyHttpModuleOptions> | KyHttpModuleOptions;
}

/**
 * @publicApi
 */
export interface KyHttpModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useExisting?: Type<KyHttpModuleOptionsFactory>;
  useClass?: Type<KyHttpModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<KyHttpModuleOptions> | KyHttpModuleOptions;
  inject?: FactoryProvider['inject'];
  /**
   * Extra providers to be registered
   */
  extraProviders?: Provider[];
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
  /**
   * The HTTP provider to use
   */
  provider: 'ky';
}
