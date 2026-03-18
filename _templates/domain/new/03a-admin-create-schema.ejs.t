---
to: src/<%= name %>/schema/admin-create-<%= name %>.schema.ts
---
<%
const pascal = h.changeCase.pascal(name)
-%>
import { z } from 'zod';
import { zodId } from '../../common/types/id.type';
import { create<%= pascal %>Schema } from './create-<%= name %>.schema';

export const adminCreate<%= pascal %>Schema = create<%= pascal %>Schema.extend({
  tenantId: zodId().openapi({ description: 'テナントID', example: 1 }),
});

export type AdminCreate<%= pascal %>Input = z.infer<typeof adminCreate<%= pascal %>Schema>;
