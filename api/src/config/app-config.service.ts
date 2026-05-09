import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly cfg: ConfigService) {}

  get nodeEnv(): string {
    return this.cfg.get<string>('NODE_ENV') ?? 'development';
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return Number(this.cfg.get<string>('PORT') ?? 4000);
  }

  get corsOrigins(): string[] {
    const raw = this.cfg.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  get databaseUrl(): string {
    return this.cfg.getOrThrow<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.cfg.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  get jwtSecret(): string {
    const v = this.cfg.get<string>('JWT_SECRET');
    if (!v) {
      if (this.isProd) {
        throw new Error('JWT_SECRET must be set in production');
      }
      return 'development-secret-change-me';
    }
    return v;
  }

  get jwtExpiresIn(): string {
    return this.cfg.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }

  get aiProvider(): 'openai' | 'gemini' | 'mock' {
    const v = (this.cfg.get<string>('AI_PROVIDER') ?? 'mock').toLowerCase();
    if (v === 'openai') return 'openai';
    if (v === 'gemini' || v === 'google') return 'gemini';
    return 'mock';
  }

  get openAiApiKey(): string | undefined {
    return this.cfg.get<string>('OPENAI_API_KEY') || undefined;
  }

  get openAiModel(): string {
    return this.cfg.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
  }

  get geminiApiKey(): string | undefined {
    return (
      this.cfg.get<string>('GEMINI_API_KEY') ||
      // Google's official env name; we accept either.
      this.cfg.get<string>('GOOGLE_API_KEY') ||
      undefined
    );
  }

  get geminiModel(): string {
    // Free tier flagship for fast multimodal + structured output.
    // Cheaper alt: 'gemini-2.5-flash-lite'. Stable older model: 'gemini-2.0-flash'.
    return this.cfg.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  get storageDriver(): 'local' | 's3' {
    return (this.cfg.get<string>('STORAGE_DRIVER') ?? 'local') === 's3' ? 's3' : 'local';
  }

  get storageLocalPath(): string {
    return this.cfg.get<string>('STORAGE_LOCAL_PATH') ?? './storage/local';
  }

  get storagePublicBaseUrl(): string {
    return this.cfg.get<string>('STORAGE_PUBLIC_BASE_URL') ?? 'http://localhost:4000/uploads';
  }

  get s3Config() {
    return {
      endpoint: this.cfg.get<string>('S3_ENDPOINT') || undefined,
      region: this.cfg.get<string>('S3_REGION') ?? 'auto',
      bucket: this.cfg.get<string>('S3_BUCKET') ?? '',
      accessKeyId: this.cfg.get<string>('S3_ACCESS_KEY_ID') ?? '',
      secretAccessKey: this.cfg.get<string>('S3_SECRET_ACCESS_KEY') ?? '',
      publicBaseUrl: this.cfg.get<string>('S3_PUBLIC_BASE_URL') ?? '',
    };
  }

  get maxUploadBytes(): number {
    return Number(this.cfg.get<string>('MAX_UPLOAD_MB') ?? 10) * 1024 * 1024;
  }

  get aiRateLimitPerMinute(): number {
    return Number(this.cfg.get<string>('AI_RATE_LIMIT_PER_MINUTE') ?? 10);
  }
}
