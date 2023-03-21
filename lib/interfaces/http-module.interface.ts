import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

export type HttpModuleOptions = AxiosRequestConfig;

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
  inject?: any[];
  extraProviders?: Provider[];
}
