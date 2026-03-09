import { z } from 'zod';
import {
  optionalString,
  optionalBoolean,
  requiredString,
} from '../../common/schema';

export const updateTodoSchema = z.object({
  title: optionalString('タイトル'),
  completed: optionalBoolean('完了フラグ'),
  tags: z.array(requiredString('タグ名')).optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
