import { z } from 'zod';

/** ページネーション共通スキーマ */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .openapi({ description: 'ページ番号', example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .default(20)
    .openapi({ description: '1ページあたりの件数（0で全件取得）', example: 20 }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/** ソート順スキーマ */
export const sortOrderSchema = z
  .enum(['asc', 'desc'])
  .default('desc')
  .openapi({ description: 'ソート順', example: 'desc' });

/** ページネーションメタ情報 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
