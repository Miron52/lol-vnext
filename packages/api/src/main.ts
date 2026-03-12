import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_PREFIX } from '@lol/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 LOL vNext API running on http://localhost:${port}${API_PREFIX}`);
}

bootstrap();
