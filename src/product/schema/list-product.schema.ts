import { z } from 'zod';
import { paginationSchema, sortOrderSchema } from '../../common/schema';

// TODO: sortBy の enum にドメイン固有のフィールドを追加、フィルタ条件を追加
export const listProductSchema = paginationSchema.extend({
  sortBy: z
    .enum(['createdAt'])
    .default('createdAt')
    .openapi({ description: 'ソート対象フィールド', example: 'createdAt' }),
  sortOrder: sortOrderSchema,
});

export type ListProductInput = z.infer<typeof listProductSchema>;
