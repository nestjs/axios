import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { KY_INSTANCE_TOKEN } from '../http.constants';
import ky, { KyInstance, KyResponse, Options, ResponsePromise } from 'ky';

export class KyProvider {
  constructor(
    @Inject(KY_INSTANCE_TOKEN)
    protected readonly instance: KyInstance = ky,
  ) {}

  get instanceRef(): KyInstance {
    return this.instance;
  }

  get<T = any>(url: string, config?: Options): Observable<KyResponse<T>> {
    return this.makeObservable<T>(this.instance.get, url, config);
  }

  head<T = any>(url: string, config?: Options): Observable<KyResponse<T>> {
    return this.makeObservable<T>(this.instance.head, url, config);
  }

  delete<T = any>(url: string, config?: Options): Observable<KyResponse<T>> {
    return this.makeObservable<T>(this.instance.delete, url, config);
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: Options,
  ): Observable<KyResponse<T>> {
    const options: Options = { ...config, json: data };
    return this.makeObservable<T>(this.instance.post, url, options);
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: Options,
  ): Observable<KyResponse<T>> {
    const options: Options = { ...config, json: data };
    return this.makeObservable<T>(this.instance.put, url, options);
  }

  patch<T = any>(
    url: string,
    data?: any,
    config?: Options,
  ): Observable<KyResponse<T>> {
    const options: Options = { ...config, json: data };
    return this.makeObservable<T>(this.instance.patch, url, options);
  }

  protected makeObservable<T>(
    kyMethod: (...args: any[]) => ResponsePromise<T>,
    ...args: any[]
  ) {
    return new Observable<KyResponse<T>>(subscriber => {
      const argsCopy = [...args];
      const configIdx = argsCopy.length - 1;
      const config: Options = { ...(argsCopy[configIdx] || {}) };
      argsCopy[configIdx] = config;

      let abortController: AbortController;

      if (!config.signal) {
        abortController = new AbortController();
        config.signal = abortController.signal;
      }

      kyMethod(...argsCopy)
        .then(res => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch(err => {
          subscriber.error(err);
        });

      return () => {
        if (abortController) abortController.abort();
      };
    });
  }
}
