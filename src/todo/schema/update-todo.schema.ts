import { z } from 'zod';
import {
  optionalString,
  optionalBoolean,
  requiredString,
} from '../../common/schema';

export const updateTodoSchema = z.object({
  title: optionalString('タイトル').openapi({
    description: 'TODOのタイトル',
    example: '買い物に行く',
  }),
  completed: optionalBoolean('完了フラグ').openapi({
    description: '完了フラグ',
    example: true,
  }),
  tags: z
    .array(requiredString('タグ名'))
    .optional()
    .openapi({ description: 'タグ名の配列', example: ['重要', '買い物'] }),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
