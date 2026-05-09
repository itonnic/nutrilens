import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * One log line per HTTP request: `METHOD path STATUS dt`.
 * Skips health probes so they don't drown the log on production.
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith('/health') || req.path.startsWith('/uploads/')) {
      return next();
    }

    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const status = res.statusCode;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
      const line = `${req.method} ${req.originalUrl} → ${status} (${durMs.toFixed(1)}ms) ${ip}`;
      if (status >= 500) this.logger.error(line);
      else if (status >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });

    next();
  };
}
