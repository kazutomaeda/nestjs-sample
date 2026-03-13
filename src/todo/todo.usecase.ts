import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { TagResolveService } from '../tag/external/tag-resolve.service';
import { AuditLogRepository } from '../audit-log/external/audit-log.repository';
import { TodoRepository } from './todo.repository';
import { TodoModel } from './todo.model';
import { TodoValidator } from './todo.validator';
import {
  CreateTodoInput,
  UpdateTodoInput,
  ListTodoInput,
  ExportTodoInput,
} from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { FindAllQuery } from './todo.repository';

@Injectable()
export class TodoUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TodoRepository,
    private readonly validator: TodoValidator,
    private readonly tagResolveService: TagResolveService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async findAll(
    ability: AppAbility,
    input: ListTodoInput,
  ): Promise<{ items: TodoModel[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      title: input.title,
      completed: input.completed,
    };
    return this.repository.findAll(ability, query);
  }

  async findAllForExport(
    ability: AppAbility,
    input: ExportTodoInput,
  ): Promise<TodoModel[]> {
    const query: FindAllQuery = {
      page: 1,
      limit: 0,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      title: input.title,
      completed: input.completed,
    };
    const { items } = await this.repository.findAll(ability, query);
    return items;
  }

  async findOne(id: number, ability: AppAbility): Promise<TodoModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: CreateTodoInput,
    tenantId: number,
    userId: number,
  ): Promise<TodoModel> {
    return this.transaction.run(async (tx) => {
      const tagIds = input.tags
        ? await this.tagResolveService.resolveTagIds(input.tags, tenantId, tx)
        : undefined;
      const todo = await this.repository.create(
        { tenantId, title: input.title, tagIds },
        tx,
      );
      await this.auditLogRepository.create(
        {
          tenantId,
          userId,
          action: 'create',
          resourceType: 'Todo',
          resourceId: todo.id,
          before: null,
          after: todo.toAuditSnapshot(),
        },
        tx,
      );
      return todo;
    });
  }

  async update(
    id: number,
    input: UpdateTodoInput,
    tenantId: number,
    userId: number,
    ability: AppAbility,
  ): Promise<TodoModel> {
    const todo = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    const updated = todo.withUpdate(input.title, input.completed);

    return this.transaction.run(async (tx) => {
      const tagIds = input.tags
        ? await this.tagResolveService.resolveTagIds(input.tags, tenantId, tx)
        : undefined;
      const result = await this.repository.update(id, updated, tagIds, tx);
      await this.auditLogRepository.create(
        {
          tenantId,
          userId,
          action: 'update',
          resourceType: 'Todo',
          resourceId: id,
          before: todo.toAuditSnapshot(),
          after: result.toAuditSnapshot(),
        },
        tx,
      );
      return result;
    });
  }

  async remove(
    id: number,
    userId: number,
    ability: AppAbility,
  ): Promise<TodoModel> {
    const todo = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      const result = await this.repository.delete(id, tx);
      await this.auditLogRepository.create(
        {
          tenantId: todo.tenantId,
          userId,
          action: 'delete',
          resourceType: 'Todo',
          resourceId: id,
          before: todo.toAuditSnapshot(),
          after: null,
        },
        tx,
      );
      return result;
    });
  }
}
