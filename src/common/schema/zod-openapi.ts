import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z, ZodSchema } from 'zod';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// Side-effect: Zod に .openapi() メソッドを追加
extendZodWithOpenApi(z);

/**
 * Zod スキーマから @ApiBody 用の OpenAPI SchemaObject を生成する
 */
export function createApiBodySchema(schema: ZodSchema): SchemaObject {
  const registry = new OpenAPIRegistry();
  registry.register('__temp__', schema);
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const components = generator.generateComponents();
  const result = components.components?.schemas?.['__temp__'];
  if (!result) {
    throw new Error('Failed to generate OpenAPI schema');
  }
  return result as unknown as SchemaObject;
}
