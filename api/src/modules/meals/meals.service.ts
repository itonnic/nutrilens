import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type {
  ConfirmMealInput,
  MealAnalysisResult,
  MealItemInput,
  MealResponse,
  UpdateMealInput,
  UploadMealInput,
} from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { sanitizeUserText } from '../../common/sanitize';
import { DashboardService } from '../dashboard/dashboard.service';

// sharp's default build does not include HEIC support — accepting it here would
// produce a runtime error in the storage layer. Browsers / iOS will fall back
// to JPEG when the file input declares `accept="image/*"` capture, so this is
// a safe set in practice.
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class MealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: AiService,
    private readonly dashboard: DashboardService,
  ) {}

  async upload(args: {
    userId: string;
    file: { buffer: Buffer; mimetype: string; size: number };
    body: UploadMealInput;
    maxBytes: number;
    /** UI locale of the user — forwarded to the AI analyzer so titles,
     *  warnings, and assumptions come back in their language. */
    locale?: string;
  }): Promise<{ meal: MealResponse; jobId: string }> {
    if (!args.file) {
      throw new BadRequestException('Image file is required');
    }
    if (!ALLOWED_MIME.has(args.file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
    if (args.file.size > args.maxBytes) {
      throw new BadRequestException('Image too large');
    }

    // Duplicate detection — hash buffer, look at the same user's meals in the last 10 minutes.
    // We persist the hash on a dedicated `imageHash` column so downstream writers (the AI
    // processor) cannot accidentally overwrite it.
    const hash = createHash('sha256').update(args.file.buffer).digest('hex');
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentDup = await this.prisma.meal.findFirst({
      where: {
        userId: args.userId,
        createdAt: { gte: tenMinAgo },
        imageHash: hash,
      },
      select: { id: true },
    });
    if (recentDup) {
      throw new ConflictException({
        message: 'Same image was uploaded in the last 10 minutes. Save again?',
        duplicateMealId: recentDup.id,
      });
    }

    let stored;
    try {
      stored = await this.storage.storeMealImage(args.file.buffer, args.file.mimetype);
    } catch (err) {
      // sharp throws when bytes are not a real image even though the MIME header was lying.
      const reason = err instanceof Error ? err.message : 'Unknown image error';
      throw new BadRequestException(`Could not read image: ${reason}`);
    }

    const consumedAt = args.body.consumedAt ? new Date(args.body.consumedAt) : new Date();
    const safeNote = sanitizeUserText(args.body.userNote);

    const meal = await this.prisma.meal.create({
      data: {
        userId: args.userId,
        mealType: args.body.mealType,
        title: 'Analyzing meal…',
        imageUrl: stored.imageUrl,
        thumbnailUrl: stored.thumbnailUrl,
        imageHash: hash,
        storageKey: stored.imageKey,
        thumbKey: stored.thumbnailKey,
        consumedAt,
        userNote: safeNote || null,
        status: 'DRAFT',
        source: 'AI',
      },
      include: { items: true },
    });

    const job = await this.ai.enqueueAnalysis({
      userId: args.userId,
      mealId: meal.id,
      imageUrl: stored.imageUrl,
      storageKey: stored.imageKey,
      userNote: safeNote || undefined,
      mealType: args.body.mealType,
      locale: args.locale,
    });

    return {
      meal: this.toResponse(meal),
      jobId: job.id,
    };
  }

  async analyze(
    userId: string,
    mealId: string,
    userNote?: string,
    locale?: string,
  ): Promise<{ jobId: string }> {
    const meal = await this.prisma.meal.findFirst({ where: { id: mealId, userId } });
    if (!meal) throw new NotFoundException('Meal not found');
    if (!meal.imageUrl) throw new BadRequestException('Meal has no image to analyze');

    const safeNote = userNote === undefined ? undefined : sanitizeUserText(userNote);
    if (safeNote !== undefined) {
      await this.prisma.meal.update({
        where: { id: mealId },
        data: { userNote: safeNote || null },
      });
    }

    const job = await this.ai.enqueueAnalysis({
      userId,
      mealId,
      imageUrl: meal.imageUrl,
      storageKey: meal.storageKey,
      userNote: safeNote ?? meal.userNote ?? undefined,
      mealType: meal.mealType,
      locale,
    });
    return { jobId: job.id };
  }

  async confirm(userId: string, mealId: string, input: ConfirmMealInput): Promise<MealResponse> {
    const existing = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Meal not found');

    const items = input.items ?? existing.items.map(this.itemToInput);
    const totals = this.totalsForItems(items);

    const updated = await this.prisma.meal.update({
      where: { id: mealId },
      data: {
        title: input.title ?? existing.title,
        status: 'CONFIRMED',
        ...totals,
        items: input.items
          ? {
              deleteMany: {},
              create: input.items.map(this.itemForCreate),
            }
          : undefined,
      },
      include: { items: true },
    });
    this.dashboard.invalidateDailyForUser(userId);
    return this.toResponse(updated);
  }

  async update(userId: string, mealId: string, input: UpdateMealInput): Promise<MealResponse> {
    const existing = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Meal not found');

    const itemsForTotals = input.items ?? existing.items.map(this.itemToInput);
    const totals = input.items ? this.totalsForItems(itemsForTotals) : null;

    const sanitizedNote =
      input.userNote === undefined
        ? existing.userNote
        : sanitizeUserText(input.userNote) || null;

    const updated = await this.prisma.meal.update({
      where: { id: mealId },
      data: {
        title: input.title ? sanitizeUserText(input.title, 140) : existing.title,
        mealType: input.mealType ?? existing.mealType,
        consumedAt: input.consumedAt ? new Date(input.consumedAt) : existing.consumedAt,
        userNote: sanitizedNote,
        ...(totals ?? {}),
        items: input.items
          ? {
              deleteMany: {},
              create: input.items.map(this.itemForCreate),
            }
          : undefined,
      },
      include: { items: true },
    });
    this.dashboard.invalidateDailyForUser(userId);
    return this.toResponse(updated);
  }

  async delete(userId: string, mealId: string): Promise<void> {
    const meal = await this.prisma.meal.findFirst({ where: { id: mealId, userId } });
    if (!meal) throw new NotFoundException('Meal not found');
    const storageKey = meal.storageKey;
    const thumbKey = meal.thumbKey;
    await this.prisma.meal.delete({ where: { id: mealId } });
    this.dashboard.invalidateDailyForUser(userId);
    if (storageKey && thumbKey) {
      await this.storage.deleteMealImage(storageKey, thumbKey).catch(() => undefined);
    }
  }

  async listByDate(userId: string, dateIso: string): Promise<MealResponse[]> {
    const { start, end } = dayBounds(dateIso);
    const meals = await this.prisma.meal.findMany({
      where: { userId, consumedAt: { gte: start, lt: end } },
      orderBy: { consumedAt: 'asc' },
      include: { items: true },
    });
    return meals.map((m) => this.toResponse(m));
  }

  async getOne(userId: string, mealId: string): Promise<MealResponse> {
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      include: { items: true },
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return this.toResponse(meal);
  }

  // ----- helpers -----

  private toResponse(meal: {
    id: string;
    userId: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK';
    title: string;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    consumedAt: Date;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
    confidence: number | null;
    source: 'AI' | 'MANUAL' | 'BARCODE' | 'RECIPE';
    status: 'DRAFT' | 'CONFIRMED' | 'NEEDS_REVIEW';
    userNote: string | null;
    aiRawJson: unknown;
    items: {
      id: string;
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number | null;
      sugar: number | null;
      sodium: number | null;
      confidence: number | null;
      assumptions: string[];
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): MealResponse {
    return {
      id: meal.id,
      userId: meal.userId,
      mealType: meal.mealType,
      title: meal.title,
      imageUrl: meal.imageUrl,
      thumbnailUrl: meal.thumbnailUrl,
      consumedAt: meal.consumedAt.toISOString(),
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      sugar: meal.sugar,
      sodium: meal.sodium,
      confidence: meal.confidence,
      source: meal.source,
      status: meal.status,
      userNote: meal.userNote,
      aiResult: this.extractAiResult(meal.aiRawJson),
      items: meal.items.map((it) => ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        fiber: it.fiber,
        sugar: it.sugar,
        sodium: it.sodium,
        confidence: it.confidence,
        assumptions: it.assumptions,
      })),
      createdAt: meal.createdAt.toISOString(),
      updatedAt: meal.updatedAt.toISOString(),
    };
  }

  private extractAiResult(raw: unknown): MealAnalysisResult | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    if ('mealTitle' in obj && 'detectedItems' in obj) {
      return obj as unknown as MealAnalysisResult;
    }
    return null;
  }

  private totalsForItems(items: MealItemInput[]) {
    return items.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.calories || 0),
        protein: acc.protein + (it.protein || 0),
        carbs: acc.carbs + (it.carbs || 0),
        fat: acc.fat + (it.fat || 0),
        fiber: (acc.fiber ?? 0) + (it.fiber ?? 0),
        sugar: (acc.sugar ?? 0) + (it.sugar ?? 0),
        sodium: (acc.sodium ?? 0) + (it.sodium ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    );
  }

  private itemForCreate = (it: MealItemInput) => ({
    name: it.name,
    quantity: it.quantity,
    unit: it.unit,
    calories: it.calories,
    protein: it.protein,
    carbs: it.carbs,
    fat: it.fat,
    fiber: it.fiber ?? null,
    sugar: it.sugar ?? null,
    sodium: it.sodium ?? null,
    confidence: null,
    assumptions: [],
  });

  private itemToInput = (it: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
  }): MealItemInput => ({
    name: it.name,
    quantity: it.quantity,
    unit: it.unit as MealItemInput['unit'],
    calories: it.calories,
    protein: it.protein,
    carbs: it.carbs,
    fat: it.fat,
    fiber: it.fiber,
    sugar: it.sugar,
    sodium: it.sodium,
  });
}

export function dayBounds(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
