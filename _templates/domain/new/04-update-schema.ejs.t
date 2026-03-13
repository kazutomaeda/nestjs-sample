---
to: src/<%= name %>/schema/update-<%= name %>.schema.ts
---
<%
const pascal = h.changeCase.pascal(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
-%>
import { z } from 'zod';

<% if (hasFields) { -%>
export const update<%= pascal %>Schema = z.object({
<% fields.forEach((f, i) => { -%>
  <%= f.name %>: <%= h.zodUpdate(f.type) %>,
<% }) -%>
});
<% } else { -%>
// TODO: ドメインに合わせてフィールドを追加
export const update<%= pascal %>Schema = z.object({});
<% } -%>

export type Update<%= pascal %>Input = z.infer<typeof update<%= pascal %>Schema>;
