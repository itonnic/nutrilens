import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { resolveLocaleFromHeader } from '../../common/locales';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('daily')
  daily(
    @CurrentUser() user: AuthUserPayload,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('date') date?: string,
  ) {
    return this.dashboard.daily(
      user.userId,
      date ?? new Date().toISOString(),
      resolveLocaleFromHeader(acceptLanguage),
    );
  }

  @Get('weekly')
  weekly(
    @CurrentUser() user: AuthUserPayload,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('start') start?: string,
  ) {
    const startIso = start ?? this.weekStart(new Date()).toISOString();
    return this.dashboard.weekly(user.userId, startIso, resolveLocaleFromHeader(acceptLanguage));
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: AuthUserPayload,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('month') month?: string,
  ) {
    const m = month ?? new Date().toISOString().slice(0, 7);
    return this.dashboard.monthly(user.userId, m, resolveLocaleFromHeader(acceptLanguage));
  }

  private weekStart(now: Date): Date {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay(); // 0 (Sun) - 6
    const offset = (day + 6) % 7; // monday-start
    d.setUTCDate(d.getUTCDate() - offset);
    return d;
  }
}
