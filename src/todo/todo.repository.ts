import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { Prisma } from '@prisma/client';
import { TagModel } from '../tag/tag.model';
import { TodoModel } from './todo.model';
import { AppAbility } from '../auth/external/casl-ability.factory';

const includeTagsOption = {
  todoTags: { include: { tag: true } },
} as const;

type TodoWithTodoTags = Prisma.TodoGetPayload<{
  include: typeof includeTagsOption;
}>;

@Injectable()
export class TodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ability: AppAbility): Promise<TodoModel[]> {
    const entities = await this.prisma.todo.findMany({
      where: accessibleBy(ability).Todo,
      orderBy: { createdAt: 'desc' },
      include: includeTagsOption,
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async findById(id: number, ability: AppAbility): Promise<TodoModel | null> {
    const entity = await this.prisma.todo.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Todo],
      },
      include: includeTagsOption,
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: { tenantId: number; title: string; tagIds?: number[] },
    tx: TransactionClient,
  ): Promise<TodoModel> {
    const entity = await tx.todo.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        ...(params.tagIds && {
          todoTags: {
            create: params.tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: includeTagsOption,
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: TodoModel,
    tagIds: number[] | undefined,
    tx: TransactionClient,
  ): Promise<TodoModel> {
    if (tagIds !== undefined) {
      await tx.todoTag.deleteMany({ where: { todoId: id } });
    }

    const entity = await tx.todo.update({
      where: { id },
      data: {
        title: model.title,
        completed: model.completed,
        ...(tagIds !== undefined && {
          todoTags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: includeTagsOption,
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<TodoModel> {
    await tx.todoTag.deleteMany({ where: { todoId: id } });
    const entity = await tx.todo.delete({
      where: { id },
      include: includeTagsOption,
    });
    return this.toModel(entity);
  }

  private toModel(entity: TodoWithTodoTags): TodoModel {
    return new TodoModel({
      id: entity.id,
      tenantId: entity.tenantId,
      title: entity.title,
      completed: entity.completed,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tags: entity.todoTags.map(
        (tt) =>
          new TagModel({
            id: tt.tag.id,
            tenantId: tt.tag.tenantId,
            name: tt.tag.name,
            createdAt: tt.tag.createdAt,
            updatedAt: tt.tag.updatedAt,
          }),
      ),
    });
  }
}
