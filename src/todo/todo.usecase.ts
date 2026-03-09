import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { TagResolveService } from '../tag/external/tag-resolve.service';
import { TodoRepository } from './todo.repository';
import { TodoModel } from './todo.model';
import { TodoValidator } from './todo.validator';
import { CreateTodoInput, UpdateTodoInput } from './schema';

@Injectable()
export class TodoUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TodoRepository,
    private readonly validator: TodoValidator,
    private readonly tagResolveService: TagResolveService,
  ) {}

  async findAll(): Promise<TodoModel[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<TodoModel> {
    return this.validator.ensureExists(await this.repository.findById(id), id);
  }

  async create(input: CreateTodoInput): Promise<TodoModel> {
    return this.transaction.run(async (tx) => {
      const tagIds = input.tags
        ? await this.tagResolveService.resolveTagIds(input.tags, tx)
        : undefined;
      return this.repository.create({ title: input.title, tagIds }, tx);
    });
  }

  async update(id: number, input: UpdateTodoInput): Promise<TodoModel> {
    const todo = this.validator.ensureExists(
      await this.repository.findById(id),
      id,
    );

    const updated = todo.withUpdate(input.title, input.completed);

    return this.transaction.run(async (tx) => {
      const tagIds = input.tags
        ? await this.tagResolveService.resolveTagIds(input.tags, tx)
        : undefined;
      return this.repository.update(id, updated, tagIds, tx);
    });
  }

  async remove(id: number): Promise<TodoModel> {
    this.validator.ensureExists(await this.repository.findById(id), id);
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
