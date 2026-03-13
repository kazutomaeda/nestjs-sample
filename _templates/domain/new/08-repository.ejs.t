---
to: src/<%= name %>/<%= name %>.repository.ts
---
<%
const pascal = h.changeCase.pascal(name)
const camel = h.changeCase.camel(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
const softDelete = !locals.hardDelete
-%>
import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { Prisma } from '@prisma/client';
import { <%= pascal %>Model } from './<%= name %>.model';
import { AppAbility } from '../auth/external/casl-ability.factory';

export interface FindAllQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class <%= pascal %>Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ability: AppAbility,
    query: FindAllQuery,
  ): Promise<{ items: <%= pascal %>Model[]; totalItems: number }> {
    const where: Prisma.<%= pascal %>WhereInput = {
      AND: [
        accessibleBy(ability).<%= pascal %>,
<% if (softDelete) { -%>
        { deletedAt: null },
<% } -%>
        // TODO: フィルタ条件を追加
      ],
    };

    const paginate = query.limit > 0;

    const [entities, totalItems] = await Promise.all([
      this.prisma.<%= camel %>.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(paginate && {
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      }),
      this.prisma.<%= camel %>.count({ where }),
    ]);

    return {
      items: entities.map((entity) => this.toModel(entity)),
      totalItems,
    };
  }

  async findById(id: number, ability: AppAbility): Promise<<%= pascal %>Model | null> {
    const entity = await this.prisma.<%= camel %>.findFirst({
      where: {
        id,
        AND: [
          accessibleBy(ability).<%= pascal %>,
<% if (softDelete) { -%>
          { deletedAt: null },
<% } -%>
        ],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
<% if (hasFields) { -%>
    params: { tenantId: number; <%= fields.map(f => `${f.name}: ${h.tsType(f.type)}`).join('; ') %> },
<% } else { -%>
    params: { tenantId: number },
<% } -%>
    tx: TransactionClient,
  ): Promise<<%= pascal %>Model> {
    const entity = await tx.<%= camel %>.create({
      data: {
        tenantId: params.tenantId,
<% if (hasFields) { -%>
<% fields.forEach(f => { -%>
        <%= f.name %>: params.<%= f.name %>,
<% }) -%>
<% } else { -%>
        // TODO: フィールドを追加
<% } -%>
      },
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: <%= pascal %>Model,
    tx: TransactionClient,
  ): Promise<<%= pascal %>Model> {
    const entity = await tx.<%= camel %>.update({
      where: { id },
      data: {
<% if (hasFields) { -%>
<% fields.forEach(f => { -%>
        <%= f.name %>: model.<%= f.name %>,
<% }) -%>
<% } else { -%>
        // TODO: フィールドを追加
<% } -%>
      },
    });
    return this.toModel(entity);
  }

<% if (softDelete) { -%>
  async delete(id: number, tx: TransactionClient): Promise<<%= pascal %>Model> {
    const entity = await tx.<%= camel %>.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.toModel(entity);
  }
<% } else { -%>
  async delete(id: number, tx: TransactionClient): Promise<<%= pascal %>Model> {
    const entity = await tx.<%= camel %>.delete({
      where: { id },
    });
    return this.toModel(entity);
  }
<% } -%>

  private toModel(entity: Prisma.<%= pascal %>GetPayload<object>): <%= pascal %>Model {
    return new <%= pascal %>Model({
      id: entity.id,
      tenantId: entity.tenantId,
<% if (hasFields) { -%>
<% fields.forEach(f => { -%>
      <%= f.name %>: entity.<%= f.name %>,
<% }) -%>
<% } else { -%>
      // TODO: フィールドを追加
<% } -%>
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
<% if (softDelete) { -%>
      deletedAt: entity.deletedAt,
<% } -%>
    });
  }
}
