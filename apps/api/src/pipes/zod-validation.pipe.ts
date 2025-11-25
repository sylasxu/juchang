import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // 如果是在 Controller 方法装饰器上使用 @UsePipes(new ZodValidationPipe(schema))
    if (this.schema) {
      return this.parse(value, this.schema);
    }
    
    // 如果是全局管道，或者基于 metatype (通常配合 nestjs-zod 使用，这里演示原生写法)
    // 原生 Zod 难以直接通过 metadata.metatype 自动推断 Schema，
    // 所以建议在 Controller 方法中显式使用 new ZodValidationPipe(CreateUserSchema)
    return value;
  }

  private parse(value: unknown, schema: ZodSchema) {
    const result = schema.safeParse(value);
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
    return result.data;
  }
}