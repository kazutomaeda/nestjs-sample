import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const createTodoSchema = z.object({
  title: requiredString('タイトル').openapi({
    description: 'TODOのタイトル',
    example: '買い物に行く',
  }),
  tags: z
    .array(requiredString('タグ名'))
    .optional()
    .openapi({ description: 'タグ名の配列', example: ['重要', '買い物'] }),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
