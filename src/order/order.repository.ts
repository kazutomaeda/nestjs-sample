import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { Prisma } from '@prisma/client';
import { OrderModel } from './order.model';
import { AppAbility } from '../auth/external/casl-ability.factory';

export interface FindAllQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ability: AppAbility,
    query: FindAllQuery,
  ): Promise<{ items: OrderModel[]; totalItems: number }> {
    const where: Prisma.OrderWhereInput = {
      AND: [
        accessibleBy(ability).Order,
        // TODO: フィルタ条件を追加
      ],
    };

    const paginate = query.limit > 0;

    const [entities, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(paginate && {
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: entities.map((entity) => this.toModel(entity)),
      totalItems,
    };
  }

  async findById(id: number, ability: AppAbility): Promise<OrderModel | null> {
    const entity = await this.prisma.order.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Order],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: { tenantId: number; title: string; amount: number; paid: boolean },
    tx: TransactionClient,
  ): Promise<OrderModel> {
    const entity = await tx.order.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        amount: params.amount,
        paid: params.paid,
      },
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: OrderModel,
    tx: TransactionClient,
  ): Promise<OrderModel> {
    const entity = await tx.order.update({
      where: { id },
      data: {
        title: model.title,
        amount: model.amount,
        paid: model.paid,
      },
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<OrderModel> {
    const entity = await tx.order.delete({
      where: { id },
    });
    return this.toModel(entity);
  }

  private toModel(entity: Prisma.OrderGetPayload<object>): OrderModel {
    return new OrderModel({
      id: entity.id,
      tenantId: entity.tenantId,
      title: entity.title,
      amount: entity.amount,
      paid: entity.paid,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
