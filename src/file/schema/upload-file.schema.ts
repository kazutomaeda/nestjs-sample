import { z } from 'zod';
import { RELATED_TABLES } from './related-tables';

export const uploadFileSchema = z.object({
  relatedTable: z
    .enum(RELATED_TABLES)
    .optional()
    .openapi({ description: '関連テーブル名', example: 'todos' }),
  relatedId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .openapi({ description: '関連レコードID', example: 1 }),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
