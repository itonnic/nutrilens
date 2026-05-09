import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';
import type { Response } from 'express';

@Catch(ZodError, BadRequestException)
export class ZodFilter implements ExceptionFilter {
  catch(exception: ZodError | BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        error: 'ValidationError',
        message: 'Invalid request body',
        issues: exception.issues.map((i) => ({ path: i.path, message: i.message, code: i.code })),
      });
      return;
    }

    const status = exception.getStatus();
    const response = exception.getResponse();
    res.status(status).json(typeof response === 'string' ? { message: response } : response);
  }
}
