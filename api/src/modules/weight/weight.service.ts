import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateWeightInput, WeightEntryResponse } from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WeightService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateWeightInput): Promise<WeightEntryResponse> {
    const entry = await this.prisma.weightEntry.create({
      data: {
        userId,
        weightKg: input.weightKg,
        loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
      },
    });
    // Keep profile.weightKg in sync with the chronologically-latest entry, not whatever
    // was just POSTed. This matters when a user back-dates a measurement (e.g. fills in
    // last week's weigh-in today) — the profile must still reflect their most recent weight.
    await this.syncLatestWeight(userId);
    return this.toResponse(entry);
  }

  async list(userId: string): Promise<WeightEntryResponse[]> {
    const entries = await this.prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 365,
    });
    return entries.map((e) => this.toResponse(e));
  }

  async delete(userId: string, id: string): Promise<void> {
    const entry = await this.prisma.weightEntry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.prisma.weightEntry.delete({ where: { id } });
    // Also re-sync profile in case the deleted entry was the latest one.
    await this.syncLatestWeight(userId);
  }

  /** Set `userProfile.weightKg` to the entry with the largest `loggedAt`. */
  private async syncLatestWeight(userId: string): Promise<void> {
    const latest = await this.prisma.weightEntry.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      select: { weightKg: true },
    });
    if (!latest) return;
    await this.prisma.userProfile
      .update({
        where: { userId },
        data: { weightKg: latest.weightKg },
      })
      .catch(() => undefined);
  }

  private toResponse(e: {
    id: string;
    weightKg: number;
    loggedAt: Date;
    createdAt: Date;
  }): WeightEntryResponse {
    return {
      id: e.id,
      weightKg: e.weightKg,
      loggedAt: e.loggedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
    };
  }
}
