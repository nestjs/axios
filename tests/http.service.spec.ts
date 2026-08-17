import { createServer, type IncomingMessage, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { Test } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HttpModule, HttpService } from '../lib/index.js';

interface ReceivedRequest {
  method: string;
  url: string;
  body: string;
  headers: IncomingMessage['headers'];
}

describe('HttpService (e2e)', () => {
  let server: Server;
  let baseURL: string;
  let service: HttpService;
  let received: ReceivedRequest[];
  /** Requests the client hung up on before the response finished. */
  let abandoned: string[];

  beforeAll(async () => {
    received = [];
    abandoned = [];
    server = createServer((req, res) => {
      res.on('close', () => {
        if (!res.writableFinished) {
          abandoned.push(req.url!);
        }
      });

      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        received.push({
          method: req.method!,
          url: req.url!,
          body: Buffer.concat(chunks).toString(),
          headers: req.headers,
        });

        if (req.url === '/boom') {
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ message: 'kaboom' }));
          return;
        }

        if (req.url === '/slow') {
          setTimeout(() => {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ slow: true }));
          }, 500);
          return;
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ method: req.method, url: req.url }));
      });
    });

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule.register({ baseURL })],
    }).compile();
    service = moduleRef.get(HttpService);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(err => (err ? reject(err) : resolve())),
    );
  });

  it('performs a GET and emits a single response', async () => {
    let emissions = 0;
    const response = await firstValueFrom(
      service.get<{ method: string; url: string }>('/things', {
        // eslint-disable-next-line
        transformResponse: [
          data => {
            emissions++;
            return JSON.parse(data);
          },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ method: 'GET', url: '/things' });
    expect(emissions).toBe(1);
  });

  it('sends a POST body', async () => {
    const response = await firstValueFrom(
      service.post('/things', { name: 'nest' }),
    );

    expect(response.status).toBe(200);
    const request = received.at(-1)!;
    expect(request.method).toBe('POST');
    expect(JSON.parse(request.body)).toEqual({ name: 'nest' });
  });

  it('supports delete, head, patch and put', async () => {
    await firstValueFrom(service.delete('/things/1'));
    expect(received.at(-1)!.method).toBe('DELETE');

    await firstValueFrom(service.head('/things/1'));
    expect(received.at(-1)!.method).toBe('HEAD');

    await firstValueFrom(service.patch('/things/1', { a: 1 }));
    expect(received.at(-1)!.method).toBe('PATCH');

    await firstValueFrom(service.put('/things/1', { a: 1 }));
    expect(received.at(-1)!.method).toBe('PUT');
  });

  it('sends multipart payloads via postForm', async () => {
    await firstValueFrom(service.postForm('/form', { a: '1', b: '2' }));

    const request = received.at(-1)!;
    expect(request.headers['content-type']).toContain('multipart/form-data');
    expect(request.body).toContain('name="a"');
    expect(request.body).toContain('name="b"');
  });

  it('errors the observable on a non-2xx response', async () => {
    await expect(firstValueFrom(service.get('/boom'))).rejects.toMatchObject({
      response: { status: 500, data: { message: 'kaboom' } },
    });
  });

  it('exposes the underlying axios instance through axiosRef', () => {
    expect(service.axiosRef.defaults.baseURL).toBe(baseURL);
  });

  it('does not mutate the caller-supplied config object', async () => {
    const config = { headers: { 'x-custom': 'yes' } };
    await firstValueFrom(service.get('/things', config));

    expect(config).toEqual({ headers: { 'x-custom': 'yes' } });
    expect(config).not.toHaveProperty('cancelToken');
  });

  it('aborts the in-flight request when the subscription is torn down', async () => {
    abandoned.length = 0;
    const events: string[] = [];
    const subscription = service.get('/slow').subscribe({
      next: () => events.push('next'),
      error: () => events.push('error'),
      complete: () => events.push('complete'),
    });

    // The server holds /slow for 500ms, so this unsubscribes mid-flight.
    await new Promise(resolve => setTimeout(resolve, 50));
    subscription.unsubscribe();
    await new Promise(resolve => setTimeout(resolve, 700));

    // The socket must actually be torn down, not merely detached from RxJS.
    expect(abandoned).toContain('/slow');
    expect(events).toEqual([]);
  });

  it('leaves a stream response running after teardown', async () => {
    abandoned.length = 0;
    const subscription = service
      .get('/slow', { responseType: 'stream' })
      .subscribe({ error: () => undefined });

    await new Promise(resolve => setTimeout(resolve, 50));
    subscription.unsubscribe();
    await new Promise(resolve => setTimeout(resolve, 700));

    expect(abandoned).not.toContain('/slow');
  });

  it('still emits when the subscription outlives the response', async () => {
    abandoned.length = 0;
    const events: string[] = [];
    service.get('/slow').subscribe({
      next: () => events.push('next'),
      complete: () => events.push('complete'),
    });

    await new Promise(resolve => setTimeout(resolve, 700));

    expect(events).toEqual(['next', 'complete']);
    expect(abandoned).not.toContain('/slow');
  });

  it('honours a caller-provided cancel token', async () => {
    const source = service.axiosRef.CancelToken?.source
      ? service.axiosRef.CancelToken.source()
      : undefined;

    if (!source) {
      return;
    }

    const promise = firstValueFrom(
      service.get('/slow', { cancelToken: source.token }),
    );
    source.cancel('aborted by test');

    await expect(promise).rejects.toMatchObject({ message: 'aborted by test' });
  });
});
