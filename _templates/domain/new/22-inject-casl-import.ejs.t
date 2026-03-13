---
to: src/auth/external/casl-ability.factory.ts
inject: true
before: "  // HYGEN:CASL-IMPORT"
skip_if: "<%= h.changeCase.pascal(name) %>,"
---
  <%= h.changeCase.pascal(name) %>,
