import { Observable } from 'rxjs';

export abstract class BaseHttpService {
  abstract get instanceRef(): any;

  abstract get<T = any>(url: string, config?: any): Observable<T>;

  abstract head<T = any>(url: string, config?: any): Observable<T>;

  abstract delete<T = any>(url: string, config?: any): Observable<T>;

  abstract put<T = any>(url: string, body?: any, config?: any): Observable<T>;

  abstract post<T = any>(url: string, body?: any, config?: any): Observable<T>;

  abstract patch<T = any>(url: string, body?: any, config?: any): Observable<T>;
}
