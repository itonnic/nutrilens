import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Apply at the parameter level: `@Body(new ZodValidationPipe(MySchema)) body: ...`
 *
 * Don't use with `@UsePipes` at controller/method level — that fires the pipe
 * for every parameter (including `@CurrentUser()` user payloads), so the wrong
 * value gets parsed against the body schema.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    return this.schema.parse(value);
  }
}
