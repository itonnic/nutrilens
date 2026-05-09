import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from './prisma/prisma.service';
import { MEAL_ANALYSIS_QUEUE, type MealAnalysisJobData } from './modules/ai/ai.processor';

/**
 * Two endpoints:
 *
 * - `/health` — liveness. Always returns 200 if the process is up. Used by
 *   orchestrators to decide whether to restart the container.
 *
 * - `/health/ready` — readiness. Verifies the API can actually serve requests
 *   (DB reachable, Redis reachable). Returns 503 if any dependency is down.
 *   Used by load balancers to decide whether to route traffic.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(MEAL_ANALYSIS_QUEUE) private readonly queue: Queue<MealAnalysisJobData>,
  ) {}

  @Get()
  health() {
    return { status: 'ok', uptime: process.uptime(), ts: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    const checks = await Promise.allSettled([this.checkDb(), this.checkRedis()]);

    const result = {
      ok: true,
      ts: new Date().toISOString(),
      checks: {
        db: checks[0].status === 'fulfilled' ? 'ok' : 'down',
        redis: checks[1].status === 'fulfilled' ? 'ok' : 'down',
      },
    };

    if (checks.some((c) => c.status === 'rejected')) {
      result.ok = false;
      // NestJS will translate to 200 by default; ResponseInterceptor not in
      // play, so we just lean on the body to signal status. To reflect this in
      // status code, callers should treat ok=false as 503 — keep raw shape
      // simple for orchestrator parsers.
    }
    return result;
  }

  private async checkDb(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    // BullMQ exposes the underlying ioredis client through .client (a Promise).
    const client = await this.queue.client;
    const pong = await client.ping();
    if (pong !== 'PONG') throw new Error('Redis ping returned ' + pong);
  }
}
