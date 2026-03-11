import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { TagModel } from '../tag.model';
import { Tag } from '../tag.entity';
import { AppAbility } from '../../auth/external/casl-ability.factory';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ability: AppAbility): Promise<TagModel[]> {
    const entities = await this.prisma.tag.findMany({
      where: accessibleBy(ability).Tag,
      orderBy: { createdAt: 'desc' },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async findById(id: number, ability: AppAbility): Promise<TagModel | null> {
    const entity = await this.prisma.tag.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Tag],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async findByName(name: string, tenantId: number): Promise<TagModel | null> {
    const entity = await this.prisma.tag.findFirst({
      where: { name, tenantId },
    });
    return entity ? this.toModel(entity) : null;
  }

  async findByNames(names: string[], tenantId: number): Promise<TagModel[]> {
    const entities = await this.prisma.tag.findMany({
      where: { name: { in: names }, tenantId },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async create(
    params: { name: string; tenantId: number },
    tx: TransactionClient,
  ): Promise<TagModel> {
    const entity = await tx.tag.create({
      data: { name: params.name, tenantId: params.tenantId },
    });
    return this.toModel(entity);
  }

  async createMany(
    names: string[],
    tenantId: number,
    tx: TransactionClient,
  ): Promise<TagModel[]> {
    const created: TagModel[] = [];
    for (const name of names) {
      const entity = await tx.tag.create({ data: { name, tenantId } });
      created.push(this.toModel(entity));
    }
    return created;
  }

  async update(
    id: number,
    model: TagModel,
    tx: TransactionClient,
  ): Promise<TagModel> {
    const entity = await tx.tag.update({
      where: { id },
      data: { name: model.name },
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<TagModel> {
    const entity = await tx.tag.delete({ where: { id } });
    return this.toModel(entity);
  }

  private toModel(entity: Tag): TagModel {
    return new TagModel({
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
