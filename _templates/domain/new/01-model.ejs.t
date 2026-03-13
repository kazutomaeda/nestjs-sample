---
to: src/<%= name %>/<%= name %>.model.ts
---
<%
const pascal = h.changeCase.pascal(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
const softDelete = !locals.hardDelete
-%>
export class <%= pascal %>Model {
  readonly id: number;
  readonly tenantId: number;
<% fields.forEach(f => { -%>
  readonly <%= f.name %>: <%= h.tsType(f.type) %>;
<% }) -%>
  readonly createdAt: Date;
  readonly updatedAt: Date;
<% if (softDelete) { -%>
  readonly deletedAt: Date | null;
<% } -%>

  constructor(params: {
    id: number;
    tenantId: number;
<% fields.forEach(f => { -%>
    <%= f.name %>: <%= h.tsType(f.type) %>;
<% }) -%>
    createdAt: Date;
    updatedAt: Date;
<% if (softDelete) { -%>
    deletedAt: Date | null;
<% } -%>
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
<% fields.forEach(f => { -%>
    this.<%= f.name %> = params.<%= f.name %>;
<% }) -%>
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
<% if (softDelete) { -%>
    this.deletedAt = params.deletedAt;
<% } -%>
  }

<% if (hasFields) { -%>
  toAuditSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
<% fields.forEach(f => { -%>
      <%= f.name %>: this.<%= f.name %>,
<% }) -%>
    };
  }

  withUpdate(params: {
<% fields.forEach(f => { -%>
    <%= f.name %>?: <%= h.tsType(f.type) %>;
<% }) -%>
  }): <%= pascal %>Model {
    return new <%= pascal %>Model({
      id: this.id,
      tenantId: this.tenantId,
<% fields.forEach(f => { -%>
      <%= f.name %>: params.<%= f.name %> ?? this.<%= f.name %>,
<% }) -%>
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
<% if (softDelete) { -%>
      deletedAt: this.deletedAt,
<% } -%>
    });
  }
<% } else { -%>
  // TODO: ドメインに合わせてフィールドを追加
  toAuditSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
    };
  }

  // TODO: ドメインに合わせてフィールドと withUpdate を追加
  withUpdate(): <%= pascal %>Model {
    return new <%= pascal %>Model({
      id: this.id,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
<% if (softDelete) { -%>
      deletedAt: this.deletedAt,
<% } -%>
    });
  }
<% } -%>
}
