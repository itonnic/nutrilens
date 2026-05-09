import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateWaterSchema, type CreateWaterInput } from '@nutrilens/shared';
import { WaterService } from './water.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod.pipe';

@Controller('water')
@UseGuards(JwtAuthGuard)
export class WaterController {
  constructor(private readonly water: WaterService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(CreateWaterSchema)) body: CreateWaterInput,
  ) {
    return this.water.create(user.userId, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUserPayload, @Query('date') date?: string) {
    return this.water.listByDate(user.userId, date ?? new Date().toISOString());
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.water.delete(user.userId, id);
  }
}
