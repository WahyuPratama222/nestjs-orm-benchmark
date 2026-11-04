import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Only log errors: request logging would add I/O noise to the measurements
  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  app.enableShutdownHooks(); // needed for onApplicationShutdown (pool.end)

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();