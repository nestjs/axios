import {
  Type,
  Provider,
  ModuleMetadata,
  FactoryProvider,
} from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

interface BaseHttpModuleOptions {
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
}

export type AxiosHttpModuleOptions = AxiosRequestConfig &
  BaseHttpModuleOptions & {
    provider?: 'axios';
  };

/**
 * @publicApi
 */
export interface AxiosHttpModuleOptionsFactory {
  createHttpOptions(): Promise<AxiosHttpModuleOptions> | AxiosHttpModuleOptions;
}

/**
 * @publicApi
 */
export interface AxiosHttpModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useExisting?: Type<AxiosHttpModuleOptionsFactory>;
  useClass?: Type<AxiosHttpModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<AxiosHttpModuleOptions> | AxiosHttpModuleOptions;
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
  provider?: 'axios';
}
