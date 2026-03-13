---
to: prisma/schema.prisma
inject: true
before: "// HYGEN:NEW-MODEL"
skip_if: "model <%= h.changeCase.pascal(name) %> "
---
<%
const pascal = h.changeCase.pascal(name)
const camel = h.changeCase.camel(name)
const snakePlural = h.inflection.pluralize(name).replace(/-/g, '_')
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
const softDelete = !locals.hardDelete
-%>

model <%= pascal %> {
  id        Int      @id @default(autoincrement())
  tenantId  Int      @map("tenant_id")
<% if (hasFields) { -%>
<% fields.forEach(f => { -%>
  <%= f.name.padEnd(9) %> <%= h.prismaType(f.type) %>
<% }) -%>
<% } -%>
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
<% if (softDelete) { -%>
  deletedAt DateTime? @map("deleted_at")
<% } -%>
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
<% if (!hasFields) { -%>

  // TODO: フィールドを追加
<% } -%>

  @@map("<%= snakePlural %>")
}
