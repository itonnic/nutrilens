import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateWaterInput, WaterEntryResponse } from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { dayBounds } from '../meals/meals.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class WaterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
  ) {}

  async create(userId: string, input: CreateWaterInput): Promise<WaterEntryResponse> {
    const entry = await this.prisma.waterEntry.create({
      data: {
        userId,
        amountMl: input.amountMl,
        loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
      },
    });
    this.dashboard.invalidateDailyForUser(userId);
    return this.toResponse(entry);
  }

  async listByDate(userId: string, dateIso: string): Promise<WaterEntryResponse[]> {
    const { start, end } = dayBounds(dateIso);
    const entries = await this.prisma.waterEntry.findMany({
      where: { userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'asc' },
    });
    return entries.map((e) => this.toResponse(e));
  }

  async delete(userId: string, id: string): Promise<void> {
    const entry = await this.prisma.waterEntry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.prisma.waterEntry.delete({ where: { id } });
    this.dashboard.invalidateDailyForUser(userId);
  }

  private toResponse(e: {
    id: string;
    amountMl: number;
    loggedAt: Date;
    createdAt: Date;
  }): WaterEntryResponse {
    return {
      id: e.id,
      amountMl: e.amountMl,
      loggedAt: e.loggedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
    };
  }
}
