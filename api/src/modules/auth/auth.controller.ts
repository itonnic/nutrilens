import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from '@nutrilens/shared';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';

const ForgotPasswordSchema = z.object({ email: z.string().email() });
type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  /**
   * Placeholder. Always returns 200 regardless of whether the email exists,
   * to avoid disclosing account existence. Real email delivery is post-MVP —
   * the `/forgot-password` web page directs users to support during the beta.
   */
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) _body: ForgotPasswordInput,
  ) {
    return {
      ok: true,
      message:
        'If an account exists for that email, instructions will be sent. (Beta: contact support.)',
    };
  }

  @Post('logout')
  logout() {
    // Stateless JWT — client just discards the token.
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUserPayload) {
    return this.auth.me(user.userId);
  }
}
