---
to: src/<%= name %>/<%= name %>.usecase.ts
---
<%
const pascal = h.changeCase.pascal(name)
const camel = h.changeCase.camel(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
-%>
import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { <%= pascal %>Repository, FindAllQuery } from './<%= name %>.repository';
import { <%= pascal %>Model } from './<%= name %>.model';
import { <%= pascal %>Validator } from './<%= name %>.validator';
import { Create<%= pascal %>Input, Update<%= pascal %>Input, List<%= pascal %>Input } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class <%= pascal %>Usecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: <%= pascal %>Repository,
    private readonly validator: <%= pascal %>Validator,
  ) {}

  async findAll(
    ability: AppAbility,
    input: List<%= pascal %>Input,
  ): Promise<{ items: <%= pascal %>Model[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      // TODO: フィルタ条件を追加
    };
    return this.repository.findAll(ability, query);
  }

  async findOne(id: number, ability: AppAbility): Promise<<%= pascal %>Model> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: Create<%= pascal %>Input,
    tenantId: number,
  ): Promise<<%= pascal %>Model> {
    return this.transaction.run(async (tx) => {
      return this.repository.create(
<% if (hasFields) { -%>
        { tenantId, <%= fields.map(f => `${f.name}: input.${f.name}`).join(', ') %> },
<% } else { -%>
        { tenantId },
<% } -%>
        tx,
      );
    });
  }

  async update(
    id: number,
    input: Update<%= pascal %>Input,
    ability: AppAbility,
  ): Promise<<%= pascal %>Model> {
    const <%= camel %> = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

<% if (hasFields) { -%>
    const updated = <%= camel %>.withUpdate({
<% fields.forEach(f => { -%>
      <%= f.name %>: input.<%= f.name %>,
<% }) -%>
    });
<% } else { -%>
    const updated = <%= camel %>.withUpdate();
<% } -%>

    return this.transaction.run(async (tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number, ability: AppAbility): Promise<<%= pascal %>Model> {
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
