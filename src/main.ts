import { NestFactory } from '@nestjs/core';
import { AppModule } from './module/app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
