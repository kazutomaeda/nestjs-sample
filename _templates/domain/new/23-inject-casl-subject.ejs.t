---
to: src/auth/external/casl-ability.factory.ts
inject: true
before: "      // HYGEN:CASL-SUBJECT"
skip_if: "<%= h.changeCase.pascal(name) %>: <%= h.changeCase.pascal(name) %>"
---
      <%= h.changeCase.pascal(name) %>: <%= h.changeCase.pascal(name) %>;
