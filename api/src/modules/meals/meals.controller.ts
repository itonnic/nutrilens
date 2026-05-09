import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  AnalyzeMealSchema,
  ConfirmMealSchema,
  UpdateMealSchema,
  UploadMealSchema,
  type AnalyzeMealInput,
  type ConfirmMealInput,
  type UpdateMealInput,
} from '@nutrilens/shared';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { resolveLocaleFromHeader } from '../../common/locales';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { AppConfigService } from '../../config/app-config.service';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(
    private readonly meals: MealsService,
    private readonly config: AppConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  @Throttle({ ai: {} })
  async upload(
    @CurrentUser() user: AuthUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('mealType') mealType: string,
    @Body('userNote') userNote: string | undefined,
    @Body('consumedAt') consumedAt: string | undefined,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    if (!file) throw new BadRequestException('image is required');
    const body = UploadMealSchema.parse({
      mealType,
      userNote: userNote || undefined,
      consumedAt: consumedAt || undefined,
    });
    return this.meals.upload({
      userId: user.userId,
      file,
      body,
      maxBytes: this.config.maxUploadBytes,
      locale: resolveLocaleFromHeader(acceptLanguage),
    });
  }

  @Post('analyze')
  @Throttle({ ai: {} })
  analyze(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(AnalyzeMealSchema)) body: AnalyzeMealInput,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    return this.meals.analyze(
      user.userId,
      body.mealId,
      body.userNote,
      resolveLocaleFromHeader(acceptLanguage),
    );
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ConfirmMealSchema)) body: ConfirmMealInput,
  ) {
    return this.meals.confirm(user.userId, id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMealSchema)) body: UpdateMealInput,
  ) {
    return this.meals.update(user.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.meals.delete(user.userId, id);
  }

  @Get()
  list(@CurrentUser() user: AuthUserPayload, @Query('date') date?: string) {
    const dateIso = date ?? new Date().toISOString();
    return this.meals.listByDate(user.userId, dateIso);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.meals.getOne(user.userId, id);
  }
}
