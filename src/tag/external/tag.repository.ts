import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { TagModel } from '../tag.model';
import { Tag } from '../tag.entity';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TagModel[]> {
    const entities = await this.prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async findById(id: number): Promise<TagModel | null> {
    const entity = await this.prisma.tag.findUnique({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async findByName(name: string): Promise<TagModel | null> {
    const entity = await this.prisma.tag.findUnique({ where: { name } });
    return entity ? this.toModel(entity) : null;
  }

  async findByNames(names: string[]): Promise<TagModel[]> {
    const entities = await this.prisma.tag.findMany({
      where: { name: { in: names } },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async create(
    params: Pick<TagModel, 'name'>,
    tx: TransactionClient,
  ): Promise<TagModel> {
    const entity = await tx.tag.create({
      data: { name: params.name },
    });
    return this.toModel(entity);
  }

  async createMany(
    names: string[],
    tx: TransactionClient,
  ): Promise<TagModel[]> {
    const created: TagModel[] = [];
    for (const name of names) {
      const entity = await tx.tag.create({ data: { name } });
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
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
