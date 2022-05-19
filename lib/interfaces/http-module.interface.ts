import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { AxiosRequestConfig, Axios } from 'axios';

export type HttpModuleOptions = AxiosRequestConfig & {
  interceptors?: {
    request?: Parameters<typeof Axios.prototype.interceptors.request.use>;
    response?: Parameters<typeof Axios.prototype.interceptors.response.use>;
  }
};

export interface HttpModuleOptionsFactory {
  createHttpOptions(): Promise<HttpModuleOptions> | HttpModuleOptions;
}

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
