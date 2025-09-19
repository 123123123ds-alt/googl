import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') ?? 4000;
  const webUrl = configService.get<string>('WEB_URL') ?? 'http://localhost:3000';

  app.enableCors({
    origin: webUrl,
    credentials: true,
  });

  await app.listen(port);
  Logger.log(`API server running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap API application', error);
  process.exit(1);
});
