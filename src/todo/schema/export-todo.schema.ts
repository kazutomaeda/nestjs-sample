import { z } from 'zod';
import { sortOrderSchema } from '../../common/schema';

export const exportTodoSchema = z.object({
  sortBy: z.enum(['createdAt', 'title']).default('createdAt').openapi({
    description: 'ソート対象フィールド (createdAt, title)',
    example: 'createdAt',
  }),
  sortOrder: sortOrderSchema,
  title: z
    .string()
    .min(1)
    .optional()
    .openapi({ description: 'タイトル部分一致検索', example: '買い物' }),
  completed: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .openapi({ description: '完了フラグでフィルタ', example: 'true' }),
});

export type ExportTodoInput = z.infer<typeof exportTodoSchema>;
