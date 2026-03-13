---
to: src/<%= name %>/schema/list-<%= name %>.schema.ts
---
<%
const pascal = h.changeCase.pascal(name)
-%>
import { z } from 'zod';
import { paginationSchema, sortOrderSchema } from '../../common/schema';

// TODO: sortBy の enum にドメイン固有のフィールドを追加、フィルタ条件を追加
export const list<%= pascal %>Schema = paginationSchema.extend({
  sortBy: z
    .enum(['createdAt'])
    .default('createdAt')
    .openapi({ description: 'ソート対象フィールド', example: 'createdAt' }),
  sortOrder: sortOrderSchema,
});

export type List<%= pascal %>Input = z.infer<typeof list<%= pascal %>Schema>;
