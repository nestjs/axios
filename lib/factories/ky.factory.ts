import ky, { KyInstance } from 'ky';
import { Provider } from '@nestjs/common';
import { HttpService } from '../http.service';
import { KyProvider } from '../providers/ky.provider';
import { KY_INSTANCE_TOKEN } from '../http.constants';
import { HttpProviderFactory } from '../interfaces/http-provider-registry.interface';

export class KyProviderFactory implements HttpProviderFactory {
  createInstance(config: any): KyInstance {
    return ky.create(config);
  }

  createProvider(config: any): Provider[] {
    return [
      {
        provide: KY_INSTANCE_TOKEN,
        useValue: this.createInstance(config),
      },
      KyProvider,
      {
        provide: HttpService,
        useClass: KyProvider,
      },
    ];
  }
}
