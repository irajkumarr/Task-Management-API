import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { validateEnv } from './config/env.validation';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new SanitizationPipe());

  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
