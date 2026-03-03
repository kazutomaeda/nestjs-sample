import { z } from 'zod';
import { optionalString, optionalBoolean } from '../../common/schema';

export const updateTodoSchema = z.object({
  title: optionalString('タイトル'),
  completed: optionalBoolean('完了フラグ'),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
