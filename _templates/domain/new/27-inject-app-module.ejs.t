---
to: src/app.module.ts
inject: true
before: "    // HYGEN:MODULE-REGISTER"
skip_if: "<%= h.changeCase.pascal(name) %>Module,"
---
    <%= h.changeCase.pascal(name) %>Module,
