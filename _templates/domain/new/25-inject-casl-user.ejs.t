---
to: src/auth/external/casl-ability.factory.ts
inject: true
before: "          // HYGEN:CASL-USER"
skip_if: "read', '<%= h.changeCase.pascal(name) %>'"
---
          can('read', '<%= h.changeCase.pascal(name) %>', { tenantId: user.tenantId });
          can('create', '<%= h.changeCase.pascal(name) %>', { tenantId: user.tenantId });
          can('update', '<%= h.changeCase.pascal(name) %>', { tenantId: user.tenantId });
