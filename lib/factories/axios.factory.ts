import { Provider } from '@nestjs/common';
import Axios, { AxiosInstance } from 'axios';
import { HttpService } from '../http.service';
import { AxiosProvider } from '../providers/axios.provider';
import { AXIOS_INSTANCE_TOKEN } from '../http.constants';
import { HttpProviderFactory } from '../interfaces/http-provider-registry.interface';

export class AxiosProviderFactory implements HttpProviderFactory {
  createInstance(config: any): AxiosInstance {
    return Axios.create(config);
  }

  createProvider(config: any): Provider[] {
    return [
      {
        provide: AXIOS_INSTANCE_TOKEN,
        useValue: this.createInstance(config),
      },
      AxiosProvider,
      {
        provide: HttpService,
        useClass: AxiosProvider,
      },
    ];
  }
}
