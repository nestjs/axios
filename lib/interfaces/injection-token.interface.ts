export interface Abstract<T> extends Function {
  prototype: T;
}

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

/**
 * @publicApi
 */
export type InjectionToken<T = any> =
  | string
  | symbol
  | Type<T>
  | Abstract<T>
  | Function;