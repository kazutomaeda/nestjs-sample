import { z } from 'zod';
import { optionalString } from '../../common/schema';

export const updateTagSchema = z.object({
  name: optionalString('タグ名'),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
