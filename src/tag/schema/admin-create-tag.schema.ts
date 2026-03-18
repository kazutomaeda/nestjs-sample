import { z } from 'zod';
import { createTagSchema } from './create-tag.schema';

export const adminCreateTagSchema = createTagSchema.extend({
  tenantId: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ description: 'テナントID', example: 1 }),
});

export type AdminCreateTagInput = z.infer<typeof adminCreateTagSchema>;
