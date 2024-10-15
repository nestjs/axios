import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

export type RequestInterceptorFunction = (
  value: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

export type ResponseInterceptorFunction = (
  value: AxiosResponse,
) => AxiosResponse | Promise<AxiosResponse>;

export type ErrorFunction = (error: any) => any;

export interface InterceptorFunctions<T> {
  onFullfilled?: T;
  onRejected?: ErrorFunction;
}

export interface InterceptorOptions {
  interceptors?: {
    request?: InterceptorFunctions<RequestInterceptorFunction>;
    response?: InterceptorFunctions<ResponseInterceptorFunction>;
  };
}

export type HttpModuleOptions = AxiosRequestConfig & InterceptorOptions;

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
