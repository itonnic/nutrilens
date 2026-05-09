import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computeNutritionTargets,
  type NutritionTargetsInput,
  type OnboardingInput,
  type ProfileResponse,
  type UpdateProfileInput,
} from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeUserText } from '../../common/sanitize';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, targets: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponse(user);
  }

  async completeOnboarding(userId: string, input: OnboardingInput): Promise<ProfileResponse> {
    const targets = computeNutritionTargets({
      age: input.age,
      gender: input.gender ?? 'OTHER',
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      activityLevel: input.activityLevel,
      goal: input.goalType,
      speed: input.goalSpeed,
    });

    const safeNotes = input.customDietNotes
      ? sanitizeUserText(input.customDietNotes)
      : null;

    await this.prisma.$transaction([
      this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          age: input.age,
          gender: input.gender ?? null,
          heightCm: input.heightCm,
          weightKg: input.weightKg,
          activityLevel: input.activityLevel,
          goalType: input.goalType,
          goalSpeed: input.goalSpeed,
          targetWeightKg: input.targetWeightKg ?? null,
          dietaryPreferences: input.dietaryPreferences,
          customDietNotes: safeNotes,
          unitSystem: input.unitSystem,
          timezone: input.timezone,
        },
        update: {
          age: input.age,
          gender: input.gender ?? null,
          heightCm: input.heightCm,
          weightKg: input.weightKg,
          activityLevel: input.activityLevel,
          goalType: input.goalType,
          goalSpeed: input.goalSpeed,
          targetWeightKg: input.targetWeightKg ?? null,
          dietaryPreferences: input.dietaryPreferences,
          customDietNotes: safeNotes,
          unitSystem: input.unitSystem,
          timezone: input.timezone,
        },
      }),
      this.prisma.nutritionTarget.upsert({
        where: { userId },
        create: { userId, ...targets },
        update: { ...targets },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { hasOnboarded: true },
      }),
      // also persist initial weight as a weight entry
      this.prisma.weightEntry.create({
        data: {
          userId,
          weightKg: input.weightKg,
          loggedAt: new Date(),
        },
      }),
    ]);

    return this.get(userId);
  }

  async update(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const safeNotes =
      input.customDietNotes === undefined
        ? undefined
        : input.customDietNotes
          ? sanitizeUserText(input.customDietNotes)
          : null;

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
        gender: input.gender ?? null,
        targetWeightKg: input.targetWeightKg ?? null,
        customDietNotes: safeNotes ?? null,
        dietaryPreferences: input.dietaryPreferences ?? [],
        timezone: input.timezone ?? 'UTC',
        unitSystem: input.unitSystem ?? 'METRIC',
      },
      update: {
        ...input,
        gender: input.gender ?? undefined,
        targetWeightKg: input.targetWeightKg ?? undefined,
        customDietNotes: safeNotes,
      },
    });
    return this.get(userId);
  }

  async updateTargets(userId: string, input: NutritionTargetsInput): Promise<ProfileResponse> {
    await this.prisma.nutritionTarget.upsert({
      where: { userId },
      create: { userId, ...input },
      update: { ...input },
    });
    return this.get(userId);
  }

  private toResponse(user: {
    hasOnboarded: boolean;
    profile: {
      id: string;
      age: number | null;
      gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
      heightCm: number | null;
      weightKg: number | null;
      activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE' | null;
      goalType: 'LOSE' | 'MAINTAIN' | 'GAIN' | 'HEALTHIER' | null;
      goalSpeed: 'SLOW' | 'BALANCED' | 'AGGRESSIVE' | null;
      targetWeightKg: number | null;
      dietaryPreferences: string[];
      customDietNotes: string | null;
      unitSystem: 'METRIC' | 'IMPERIAL';
      timezone: string;
    } | null;
    targets: {
      dailyCalories: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
      fiberGrams: number;
      waterMl: number;
    } | null;
  }): ProfileResponse {
    const p = user.profile;
    return {
      id: p?.id ?? '',
      age: p?.age ?? null,
      gender: p?.gender ?? null,
      heightCm: p?.heightCm ?? null,
      weightKg: p?.weightKg ?? null,
      activityLevel: p?.activityLevel ?? null,
      goalType: p?.goalType ?? null,
      goalSpeed: p?.goalSpeed ?? null,
      targetWeightKg: p?.targetWeightKg ?? null,
      dietaryPreferences: p?.dietaryPreferences ?? [],
      customDietNotes: p?.customDietNotes ?? null,
      unitSystem: p?.unitSystem ?? 'METRIC',
      timezone: p?.timezone ?? 'UTC',
      hasOnboarded: user.hasOnboarded,
      targets: user.targets
        ? {
            dailyCalories: user.targets.dailyCalories,
            proteinGrams: user.targets.proteinGrams,
            carbsGrams: user.targets.carbsGrams,
            fatGrams: user.targets.fatGrams,
            fiberGrams: user.targets.fiberGrams,
            waterMl: user.targets.waterMl,
          }
        : null,
    };
  }
}
