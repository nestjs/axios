import { BaseHttpService } from './interfaces/http-service.interface';

/**
 * HttpService is provided by the module based on the selected provider.
 * It extends BaseHttpService to ensure type safety and consistent API.
 * @publicApi
 */
export abstract class HttpService extends BaseHttpService {}
