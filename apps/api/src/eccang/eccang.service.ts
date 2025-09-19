import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import {
  EccangBaseResponse,
  EccangCreateOrderResponse,
  EccangGetLabelUrlResponse,
  EccangGetTrackNumberResponse,
} from '@googl/shared';

type SupportedResponse =
  | typeof EccangCreateOrderResponse
  | typeof EccangGetTrackNumberResponse
  | typeof EccangGetLabelUrlResponse
  | typeof EccangBaseResponse;

@Injectable()
export class EccangService {
  private readonly logger = new Logger(EccangService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false });
  private readonly endpoint: string;
  private readonly appToken: string;
  private readonly appKey: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('ECCANG_BASE_URL');
    const servicePath = this.configService.get<string>('ECCANG_SERVICE_PATH');
    this.endpoint = `${baseUrl ?? ''}${servicePath ?? ''}`;
    this.appToken = this.configService.get<string>('ECCANG_APP_TOKEN') ?? '';
    this.appKey = this.configService.get<string>('ECCANG_APP_KEY') ?? '';
  }

  async call<T>(service: string, params: unknown, schema: SupportedResponse): Promise<T> {
    const bodyJson = JSON.stringify(params);
    const soapEnvelope = this.buildEnvelope(service, bodyJson);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: soapEnvelope,
    });

    const text = await response.text();

    if (!response.ok) {
      this.logger.error(`ECCang ${service} failed with status ${response.status}: ${text}`);
      throw new Error(`ECCang request failed with status ${response.status}`);
    }

    const parsed = this.parser.parse(text);
    const body =
      parsed?.['SOAP-ENV:Envelope']?.['SOAP-ENV:Body'] ??
      parsed?.Envelope?.Body ??
      parsed?.Body;

    const callServiceResponse =
      body?.['ns1:callServiceResponse'] ??
      body?.callServiceResponse ??
      body?.response ??
      body;

    const responseJson =
      callServiceResponse?.response ??
      callServiceResponse?.return ??
      callServiceResponse?.Response ??
      null;

    if (typeof responseJson !== 'string') {
      this.logger.error(`ECCang ${service} returned unexpected payload`, responseJson);
      throw new Error('Invalid ECCang response payload');
    }

    const data = JSON.parse(responseJson);
    const validation = schema.safeParse(data);
    if (!validation.success) {
      this.logger.error(`ECCang ${service} response validation failed`, validation.error);
      throw new Error('Invalid ECCang response structure');
    }

    if (validation.data.ask === 'Failure') {
      const errorMessage =
        validation.data.message ??
        validation.data?.Error?.errMessage ??
        'ECCang request failed';
      throw new Error(errorMessage);
    }

    return validation.data as unknown as T;
  }

  private buildEnvelope(service: string, jsonString: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.example.org/Ec/">` +
      `<SOAP-ENV:Body>` +
      `<ns1:callService>` +
      `<paramsJson><![CDATA[${jsonString}]]></paramsJson>` +
      `<appToken>${this.escape(this.appToken)}</appToken>` +
      `<appKey>${this.escape(this.appKey)}</appKey>` +
      `<service>${this.escape(service)}</service>` +
      `</ns1:callService>` +
      `</SOAP-ENV:Body>` +
      `</SOAP-ENV:Envelope>`;
  }

  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
