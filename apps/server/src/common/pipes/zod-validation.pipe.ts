import {
  type ArgumentMetadata,
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: any) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed', { cause: error });
    }
  }
}
