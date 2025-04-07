import {
  FactoryProvider,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

export type HttpModuleOptions = AxiosRequestConfig & {
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
};

/**
 * @publicApi
 */
export interface HttpModuleOptionsFactory {
  createHttpOptions(): Promise<HttpModuleOptions> | HttpModuleOptions;
}

/**
 * @publicApi
 */
export interface HttpModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<HttpModuleOptionsFactory>;
  useClass?: Type<HttpModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<HttpModuleOptions> | HttpModuleOptions;
  inject?: FactoryProvider['inject'];
  /**
   * Extra providers to be registered
   */
  extraProviders?: Provider[];
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
}
