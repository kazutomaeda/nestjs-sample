import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const createTodoSchema = z.object({
  title: requiredString('タイトル'),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
