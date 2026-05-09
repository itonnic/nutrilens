import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { ZodFilter } from './common/zod.filter';
import { HttpLoggerMiddleware } from './common/http-logger.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  // Liveness/readiness probes must work without /api prefix so deploy hosts
  // (Railway, Fly, Kubernetes) can hit them at fixed paths.
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready', 'uploads/(.*)'] });

  // We validate request bodies with Zod via `ZodValidationPipe`, not class-validator.
  // Adding the global class-validator `ValidationPipe` here would whitelist-strip
  // every plain-object body before our Zod pipes could see them.

  app.useGlobalFilters(new ZodFilter());

  // Lightweight request log: method path → status duration. Skips /health* to
  // keep probe traffic out of the logs.
  app.use(new HttpLoggerMiddleware().use);

  // Wire SIGTERM/SIGINT into Nest's lifecycle so Prisma disconnects, BullMQ
  // workers stop accepting jobs, and in-flight HTTP requests can drain.
  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.log(`NutriLens API listening on http://localhost:${config.port}`);

  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, async () => {
      logger.log(`Received ${sig}, shutting down gracefully…`);
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap();
