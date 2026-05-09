import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MealsModule } from './modules/meals/meals.module';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WaterModule } from './modules/water/water.module';
import { WeightModule } from './modules/weight/weight.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    PrismaModule,
    StorageModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        // Default global limit (used by most endpoints).
        { name: 'default', ttl: 60_000, limit: 120 },
        // Stricter named limit for AI analysis endpoints.
        { name: 'ai', ttl: 60_000, limit: config.aiRateLimitPerMinute },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'storage', 'local'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    AuthModule,
    ProfileModule,
    MealsModule,
    AiModule,
    DashboardModule,
    WaterModule,
    WeightModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
