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
import { AuditLogRepository } from '../audit-log/external/audit-log.repository';
import { <%= pascal %>Repository, FindAllQuery } from './<%= name %>.repository';
import { <%= pascal %>Model } from './<%= name %>.model';
import { <%= pascal %>Validator } from './<%= name %>.validator';
import { Create<%= pascal %>Input, Update<%= pascal %>Input, List<%= pascal %>Input } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { ResourceId } from '../common/types/id.type';

@Injectable()
export class <%= pascal %>Usecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: <%= pascal %>Repository,
    private readonly validator: <%= pascal %>Validator,
    private readonly auditLogRepository: AuditLogRepository,
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

  async findOne(id: ResourceId, ability: AppAbility): Promise<<%= pascal %>Model> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: Create<%= pascal %>Input,
    tenantId: ResourceId,
    userId: ResourceId,
  ): Promise<<%= pascal %>Model> {
    return this.transaction.run(async (tx) => {
      const <%= camel %> = await this.repository.create(
<% if (hasFields) { -%>
        { tenantId, <%= fields.map(f => `${f.name}: input.${f.name}`).join(', ') %> },
<% } else { -%>
        { tenantId },
<% } -%>
        tx,
      );
      await this.auditLogRepository.create(
        {
          tenantId,
          actorType: 'user',
          actorId: userId,
          action: 'create',
          resourceType: '<%= pascal %>',
          resourceId: <%= camel %>.id,
          before: null,
          after: <%= camel %>.toAuditSnapshot(),
        },
        tx,
      );
      return <%= camel %>;
    });
  }

  async update(
    id: ResourceId,
    input: Update<%= pascal %>Input,
    tenantId: ResourceId,
    userId: ResourceId,
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
      const result = await this.repository.update(id, updated, tx);
      await this.auditLogRepository.create(
        {
          tenantId,
          actorType: 'user',
          actorId: userId,
          action: 'update',
          resourceType: '<%= pascal %>',
          resourceId: id,
          before: <%= camel %>.toAuditSnapshot(),
          after: result.toAuditSnapshot(),
        },
        tx,
      );
      return result;
    });
  }

  async remove(id: ResourceId, userId: ResourceId, ability: AppAbility): Promise<<%= pascal %>Model> {
    const <%= camel %> = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      const result = await this.repository.delete(id, tx);
      await this.auditLogRepository.create(
        {
          tenantId: <%= camel %>.tenantId,
          actorType: 'user',
          actorId: userId,
          action: 'delete',
          resourceType: '<%= pascal %>',
          resourceId: id,
          before: <%= camel %>.toAuditSnapshot(),
          after: null,
        },
        tx,
      );
      return result;
    });
  }
}
