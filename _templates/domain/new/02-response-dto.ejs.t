---
to: src/<%= name %>/dto/<%= name %>-response.dto.ts
---
<%
const pascal = h.changeCase.pascal(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
-%>
import { ResourceId } from '../../common/types/id.type';

export class <%= pascal %>ResponseDto {
  /** ID */
  id: ResourceId;

<% if (hasFields) { -%>
<% fields.forEach(f => { -%>
  <%= f.name %>: <%= h.tsType(f.type) %>;

<% }) -%>
<% } else { -%>
  // TODO: ドメインに合わせてフィールドを追加

<% } -%>
  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
