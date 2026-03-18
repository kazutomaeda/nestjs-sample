import { z } from 'zod';
import { paginationSchema, sortOrderSchema } from '../../common/schema';

export const listAuditLogSchema = paginationSchema.extend({
  sortBy: z.enum(['createdAt']).default('createdAt').openapi({
    description: 'ソート対象フィールド',
    example: 'createdAt',
  }),
  sortOrder: sortOrderSchema,
  action: z
    .enum(['create', 'update', 'delete'])
    .optional()
    .openapi({ description: '操作種別でフィルタ', example: 'create' }),
  resourceType: z
    .string()
    .min(1)
    .optional()
    .openapi({ description: 'リソース種別でフィルタ', example: 'Todo' }),
  actorType: z
    .enum(['admin', 'user'])
    .optional()
    .openapi({ description: '操作者種別でフィルタ', example: 'user' }),
  actorId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .openapi({ description: '操作者IDでフィルタ', example: 1 }),
});

export type ListAuditLogInput = z.infer<typeof listAuditLogSchema>;
