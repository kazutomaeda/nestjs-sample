import { z } from 'zod';
import { zodId } from '../../common/types/id.type';
import { createTagSchema } from './create-tag.schema';

export const adminCreateTagSchema = createTagSchema.extend({
  tenantId: zodId().openapi({ description: 'テナントID', example: 1 }),
});

export type AdminCreateTagInput = z.infer<typeof adminCreateTagSchema>;
