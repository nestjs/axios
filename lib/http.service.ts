import { Inject } from '@nestjs/common';
import Axios, {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from 'axios';
import { Observable } from 'rxjs';
import { AXIOS_INSTANCE_TOKEN } from './http.constants.js';

export class HttpService {
  constructor(
    @Inject(AXIOS_INSTANCE_TOKEN)
    protected readonly instance: AxiosInstance = Axios,
  ) {}

  request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.request, config);
  }

  get<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.makeObservable<T>(this.instance.get, url, config);
  }

  delete<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.makeObservable<T>(this.instance.delete, url, config);
  }

  head<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.makeObservable<T>(this.instance.head, url, config);
  }

  post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.post, url, data, config);
  }

  put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.put, url, data, config);
  }

  patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.patch, url, data, config);
  }

  postForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  postForm<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.postForm, url, data, config);
  }

  putForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  putForm<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.putForm, url, data, config);
  }

  patchForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  patchForm<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.patchForm, url, data, config);
  }

  query<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>>;
  query<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeObservable<T>(this.instance.query, url, data, config);
  }

  get axiosRef(): AxiosInstance {
    return this.instance;
  }

  protected makeObservable<T>(
    axios: (...args: any[]) => AxiosPromise<T>,
    ...args: any[]
  ) {
    return new Observable<AxiosResponse<T>>(subscriber => {
      const argsCopy = [...args];
      const configIdx = argsCopy.length - 1;
      const config: AxiosRequestConfig = { ...(argsCopy[configIdx] || {}) };
      argsCopy[configIdx] = config;

      const controller = new AbortController();
      let cleanupSignal: (() => void) | undefined;
      const callerSignal = config.signal;
      if (callerSignal) {
        if (callerSignal.aborted) {
          controller.abort((callerSignal as any).reason);
        } else if (typeof callerSignal.addEventListener === 'function') {
          const onAbort = () => controller.abort((callerSignal as any).reason);
          callerSignal.addEventListener('abort', onAbort, { once: true });
          cleanupSignal = () =>
            callerSignal.removeEventListener?.('abort', onAbort);
        }
      }
      config.signal = controller.signal;

      let cancelSource: CancelTokenSource;
      if (!config.cancelToken) {
        cancelSource = Axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
      }

      let isSettled = false;
      axios(...argsCopy)
        .then(res => {
          isSettled = true;
          cleanupSignal?.();
          subscriber.next(res);
          subscriber.complete();
        })
        .catch(err => {
          isSettled = true;
          cleanupSignal?.();
          subscriber.error(err);
        });
      return () => {
        cleanupSignal?.();
        if (config.responseType === 'stream' || isSettled) {
          return;
        }

        controller.abort();
        if (cancelSource) {
          cancelSource.cancel();
        }
      };
    });
  }
}
