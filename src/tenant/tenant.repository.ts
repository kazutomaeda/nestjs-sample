import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { TenantModel } from './tenant.model';
import { Tenant } from './tenant.entity';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ability: AppAbility): Promise<TenantModel[]> {
    const entities = await this.prisma.tenant.findMany({
      where: accessibleBy(ability).Tenant,
      orderBy: { createdAt: 'desc' },
    });
    return entities.map((entity) => this.toModel(entity as Tenant));
  }

  async findById(id: number, ability: AppAbility): Promise<TenantModel | null> {
    const entity = await this.prisma.tenant.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Tenant],
      },
    });
    return entity ? this.toModel(entity as Tenant) : null;
  }

  async create(
    params: { name: string },
    tx: TransactionClient,
  ): Promise<TenantModel> {
    const entity = await tx.tenant.create({
      data: { name: params.name },
    });
    return this.toModel(entity as Tenant);
  }

  async update(
    id: number,
    model: TenantModel,
    tx: TransactionClient,
  ): Promise<TenantModel> {
    const entity = await tx.tenant.update({
      where: { id },
      data: { name: model.name },
    });
    return this.toModel(entity as Tenant);
  }

  async delete(id: number, tx: TransactionClient): Promise<TenantModel> {
    // Ordered deletion: TodoTags → Todos → Tags → Users → Tenant
    const todoIds = await tx.todo.findMany({
      where: { tenantId: id },
      select: { id: true },
    });
    if (todoIds.length > 0) {
      await tx.todoTag.deleteMany({
        where: { todoId: { in: todoIds.map((t) => t.id) } },
      });
    }
    await tx.todo.deleteMany({ where: { tenantId: id } });
    await tx.tag.deleteMany({ where: { tenantId: id } });
    await tx.user.deleteMany({ where: { tenantId: id } });
    const entity = await tx.tenant.delete({ where: { id } });
    return this.toModel(entity as Tenant);
  }

  private toModel(entity: Tenant): TenantModel {
    return new TenantModel({
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
