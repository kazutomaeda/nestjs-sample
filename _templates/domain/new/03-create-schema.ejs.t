---
to: src/<%= name %>/schema/create-<%= name %>.schema.ts
---
<%
const pascal = h.changeCase.pascal(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
-%>
import { z } from 'zod';

<% if (hasFields) { -%>
export const create<%= pascal %>Schema = z.object({
<% fields.forEach((f, i) => { -%>
  <%= f.name %>: <%= h.zodCreate(f.type) %>,
<% }) -%>
});
<% } else { -%>
// TODO: ドメインに合わせてフィールドを追加
export const create<%= pascal %>Schema = z.object({});
<% } -%>

export type Create<%= pascal %>Input = z.infer<typeof create<%= pascal %>Schema>;
