import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const createTodoSchema = z.object({
  title: requiredString('タイトル'),
  tags: z.array(requiredString('タグ名')).optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
