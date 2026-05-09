import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  NutritionTargetsSchema,
  OnboardingSchema,
  UpdateProfileSchema,
  type NutritionTargetsInput,
  type OnboardingInput,
  type UpdateProfileInput,
} from '@nutrilens/shared';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod.pipe';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('profile')
  get(@CurrentUser() user: AuthUserPayload) {
    return this.profile.get(user.userId);
  }

  @Post('profile/onboarding')
  onboarding(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(OnboardingSchema)) body: OnboardingInput,
  ) {
    return this.profile.completeOnboarding(user.userId, body);
  }

  @Patch('profile')
  update(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profile.update(user.userId, body);
  }

  @Patch('nutrition-targets')
  updateTargets(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(NutritionTargetsSchema)) body: NutritionTargetsInput,
  ) {
    return this.profile.updateTargets(user.userId, body);
  }
}
