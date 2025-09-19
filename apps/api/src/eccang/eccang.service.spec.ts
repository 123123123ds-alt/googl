import { ConfigService } from '@nestjs/config';
import { EccangBaseResponse } from '@googl/shared';
import { EccangService } from './eccang.service';

describe('EccangService', () => {
  const config = {
    get: (key: string) => {
      switch (key) {
        case 'ECCANG_BASE_URL':
          return 'http://example.com';
        case 'ECCANG_SERVICE_PATH':
          return '/service';
        case 'ECCANG_APP_TOKEN':
          return 'token';
        case 'ECCANG_APP_KEY':
          return 'key';
        default:
          return undefined;
      }
    },
  } as unknown as ConfigService;

  let service: EccangService;

  beforeEach(() => {
    service = new EccangService(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('wraps payload and parses a successful response', async () => {
    const sampleXml = `<?xml version="1.0"?>
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <ns1:callServiceResponse>
            <response>{"ask":"Success","message":"OK"}</response>
          </ns1:callServiceResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>`;

    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(sampleXml, { status: 200, headers: { 'Content-Type': 'application/xml' } }));

    const result = await service.call('createOrder', { foo: 'bar' }, EccangBaseResponse);

    expect(result).toEqual({ ask: 'Success', message: 'OK' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://example.com/service',
      expect.objectContaining({ method: 'POST' }),
    );

    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain('<service>createOrder</service>');
    expect(body).toContain('<paramsJson><![CDATA[{"foo":"bar"}]]></paramsJson>');
  });

  it('throws when ECCang responds with failure', async () => {
    const sampleXml = `<?xml version="1.0"?>
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <ns1:callServiceResponse>
            <response>{"ask":"Failure","message":"Invalid"}</response>
          </ns1:callServiceResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>`;

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(sampleXml, { status: 200, headers: { 'Content-Type': 'application/xml' } }));

    await expect(
      service.call('createOrder', { foo: 'bar' }, EccangBaseResponse),
    ).rejects.toThrow('Invalid');
  });
});
