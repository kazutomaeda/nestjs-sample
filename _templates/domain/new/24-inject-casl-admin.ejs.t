---
to: src/auth/external/casl-ability.factory.ts
inject: true
before: "          // HYGEN:CASL-ADMIN"
skip_if: "manage', '<%= h.changeCase.pascal(name) %>'"
---
          can('manage', '<%= h.changeCase.pascal(name) %>', { tenantId: user.tenantId });
