---
to: prisma/schema.prisma
inject: true
before: "  // HYGEN:TENANT-RELATION"
skip_if: "<%= h.inflection.pluralize(name).replace(/-/g, '_') %>  <%= h.changeCase.pascal(name) %>\\[\\]"
---
  <%= h.inflection.pluralize(name).replace(/-/g, '_') %>  <%= h.changeCase.pascal(name) %>[]
