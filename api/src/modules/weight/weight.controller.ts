import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateWeightSchema, type CreateWeightInput } from '@nutrilens/shared';
import { WeightService } from './weight.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod.pipe';

@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
  constructor(private readonly weight: WeightService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(CreateWeightSchema)) body: CreateWeightInput,
  ) {
    return this.weight.create(user.userId, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUserPayload) {
    return this.weight.list(user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.weight.delete(user.userId, id);
  }
}
