import { z } from 'zod';
import { optionalString } from '../../common/schema';

export const updateTagSchema = z.object({
  name: optionalString('タグ名').openapi({
    description: 'タグ名',
    example: '重要',
  }),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
