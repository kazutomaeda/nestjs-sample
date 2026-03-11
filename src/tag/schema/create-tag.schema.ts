import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const createTagSchema = z.object({
  name: requiredString('タグ名').openapi({
    description: 'タグ名',
    example: '重要',
  }),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
