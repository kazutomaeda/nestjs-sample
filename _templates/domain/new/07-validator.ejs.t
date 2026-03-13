---
to: src/<%= name %>/<%= name %>.validator.ts
---
<%
const pascal = h.changeCase.pascal(name)
const camel = h.changeCase.camel(name)
-%>
import { Injectable, NotFoundException } from '@nestjs/common';
import { <%= pascal %>Model } from './<%= name %>.model';

@Injectable()
export class <%= pascal %>Validator {
  ensureExists(<%= camel %>: <%= pascal %>Model | null, id: number): <%= pascal %>Model {
    if (!<%= camel %>) {
      throw new NotFoundException(`<%= pascal %> with id ${id} was not found`);
    }
    return <%= camel %>;
  }
}
