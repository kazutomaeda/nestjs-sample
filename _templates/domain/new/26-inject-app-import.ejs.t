---
to: src/app.module.ts
inject: true
before: "// HYGEN:MODULE-IMPORT"
skip_if: "<%= h.changeCase.pascal(name) %>Module"
---
import { <%= h.changeCase.pascal(name) %>Module } from './<%= name %>/<%= name %>.module';
