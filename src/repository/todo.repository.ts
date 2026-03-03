import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { TodoModel } from '../todo/todo.model';
import { Todo } from './todo.entity';

@Injectable()
export class TodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TodoModel[]> {
    const entities = await this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async findById(id: number): Promise<TodoModel | null> {
    const entity = await this.prisma.todo.findUnique({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: Pick<TodoModel, 'title'>,
    tx: TransactionClient,
  ): Promise<TodoModel> {
    const entity = await tx.todo.create({
      data: { title: params.title },
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: TodoModel,
    tx: TransactionClient,
  ): Promise<TodoModel> {
    const entity = await tx.todo.update({
      where: { id },
      data: {
        title: model.title,
        completed: model.completed,
      },
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<TodoModel> {
    const entity = await tx.todo.delete({ where: { id } });
    return this.toModel(entity);
  }

  private toModel(entity: Todo): TodoModel {
    return new TodoModel({
      id: entity.id,
      title: entity.title,
      completed: entity.completed,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
