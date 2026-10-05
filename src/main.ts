import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { Logger } from '@nestjs/common';
import 'dotenv/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  // Enable CORS for frontend requests (Vite dev or production)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = config.port;
  const host = config.host;

  await app.listen(port, host);

  logger.log(`====================================================`);
  logger.log(`🚀 AR Video Booth Backend Running on http://${host}:${port}`);
  logger.log(`📊 Analytics Dashboard: ${config.baseUrl}/dashboard`);
  logger.log(`📹 Upload Endpoint:     ${config.baseUrl}/api/videos/upload`);
  logger.log(`====================================================`);
}

await bootstrap();
