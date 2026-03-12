import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { Prisma } from '@prisma/client';
import { ProductModel } from './product.model';
import { AppAbility } from '../auth/external/casl-ability.factory';

export interface FindAllQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ability: AppAbility,
    query: FindAllQuery,
  ): Promise<{ items: ProductModel[]; totalItems: number }> {
    const where: Prisma.ProductWhereInput = {
      AND: [
        accessibleBy(ability).Product,
        // TODO: フィルタ条件を追加
      ],
    };

    const paginate = query.limit > 0;

    const [entities, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(paginate && {
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: entities.map((entity) => this.toModel(entity)),
      totalItems,
    };
  }

  async findById(id: number, ability: AppAbility): Promise<ProductModel | null> {
    const entity = await this.prisma.product.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Product],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: { tenantId: number; name: string   },
    tx: TransactionClient,
  ): Promise<ProductModel> {
    const entity = await tx.product.create({
      data: {
        tenantId: params.tenantId,
        name: params.name,
        // TODO: フィールドを追加
      },
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: ProductModel,
    tx: TransactionClient,
  ): Promise<ProductModel> {
    const entity = await tx.product.update({
      where: { id },
      data: {
        // TODO: フィールドを追加
      },
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<ProductModel> {
    const entity = await tx.product.delete({
      where: { id },
    });
    return this.toModel(entity);
  }

  private toModel(entity: Prisma.ProductGetPayload<object>): ProductModel {
    return new ProductModel({
      id: entity.id,
      name: entity.name,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      // TODO: フィールドを追加
    });
  }
}
