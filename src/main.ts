import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './module/app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
