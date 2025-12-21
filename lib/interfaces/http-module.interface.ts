import {
  KyHttpModuleOptions,
  KyHttpModuleAsyncOptions,
  KyHttpModuleOptionsFactory,
} from './http-module-ky.interface';
import {
  AxiosHttpModuleOptions,
  AxiosHttpModuleAsyncOptions,
  AxiosHttpModuleOptionsFactory,
} from './http-module-axios.interface';

export type HttpProvider = 'axios' | 'ky';

export interface BaseHttpModuleOptions {
  /**
   * The HTTP provider to use
   */
  provider?: HttpProvider;
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
  [key: string]: any;
}

export type HttpModuleOptions =
  | AxiosHttpModuleOptions
  | KyHttpModuleOptions
  | BaseHttpModuleOptions;

export interface BaseHttpModuleAsyncOptions {
  /**
   * The HTTP provider to use
   */
  provider?: HttpProvider;
  /**
   * Set to true to register HttpModule as a global module
   */
  global?: boolean;
  /**
   * Extra providers to be registered
   */
  extraProviders?: any[];
  /**
   * Imports array
   */
  imports?: any[];
  useExisting?: any;
  useClass?: any;
  useFactory?: (...args: any[]) => any;
  inject?: any[];
  [key: string]: any;
}

export type HttpModuleAsyncOptions =
  | AxiosHttpModuleAsyncOptions
  | KyHttpModuleAsyncOptions
  | BaseHttpModuleAsyncOptions;

/**
 * @publicApi
 */
export type HttpModuleOptionsFactory =
  | AxiosHttpModuleOptionsFactory
  | KyHttpModuleOptionsFactory;

export type {
  AxiosHttpModuleOptions,
  AxiosHttpModuleAsyncOptions,
} from './http-module-axios.interface';
export type {
  KyHttpModuleOptions,
  KyHttpModuleAsyncOptions,
} from './http-module-ky.interface';
