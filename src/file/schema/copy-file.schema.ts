import { z } from 'zod';
import { RELATED_TABLES } from './related-tables';

export const copyFileSchema = z.object({
  relatedTable: z
    .enum(RELATED_TABLES)
    .optional()
    .openapi({ description: 'コピー先の関連テーブル名', example: 'todos' }),
  relatedId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .openapi({ description: 'コピー先の関連レコードID', example: 2 }),
});

export type CopyFileInput = z.infer<typeof copyFileSchema>;
