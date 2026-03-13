import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { AuditLogRepository } from '../audit-log/external/audit-log.repository';
import { OrderRepository, FindAllQuery } from './order.repository';
import { OrderModel } from './order.model';
import { OrderValidator } from './order.validator';
import { CreateOrderInput, UpdateOrderInput, ListOrderInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class OrderUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: OrderRepository,
    private readonly validator: OrderValidator,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async findAll(
    ability: AppAbility,
    input: ListOrderInput,
  ): Promise<{ items: OrderModel[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      // TODO: フィルタ条件を追加
    };
    return this.repository.findAll(ability, query);
  }

  async findOne(id: number, ability: AppAbility): Promise<OrderModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: CreateOrderInput,
    tenantId: number,
    userId: number,
  ): Promise<OrderModel> {
    return this.transaction.run(async (tx) => {
      const order = await this.repository.create(
        {
          tenantId,
          title: input.title,
          amount: input.amount,
          paid: input.paid,
        },
        tx,
      );
      await this.auditLogRepository.create(
        {
          tenantId,
          userId,
          action: 'create',
          resourceType: 'Order',
          resourceId: order.id,
          before: null,
          after: {
            id: order.id,
            title: order.title,
            amount: order.amount,
            paid: order.paid,
          },
        },
        tx,
      );
      return order;
    });
  }

  async update(
    id: number,
    input: UpdateOrderInput,
    tenantId: number,
    userId: number,
    ability: AppAbility,
  ): Promise<OrderModel> {
    const order = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    const updated = order.withUpdate({
      title: input.title,
      amount: input.amount,
      paid: input.paid,
    });

    return this.transaction.run(async (tx) => {
      const result = await this.repository.update(id, updated, tx);
      await this.auditLogRepository.create(
        {
          tenantId,
          userId,
          action: 'update',
          resourceType: 'Order',
          resourceId: id,
          before: {
            id: order.id,
            title: order.title,
            amount: order.amount,
            paid: order.paid,
          },
          after: {
            id: result.id,
            title: result.title,
            amount: result.amount,
            paid: result.paid,
          },
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
  ): Promise<OrderModel> {
    const order = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      const result = await this.repository.delete(id, tx);
      await this.auditLogRepository.create(
        {
          tenantId: order.tenantId,
          userId,
          action: 'delete',
          resourceType: 'Order',
          resourceId: id,
          before: {
            id: order.id,
            title: order.title,
            amount: order.amount,
            paid: order.paid,
          },
          after: null,
        },
        tx,
      );
      return result;
    });
  }
}
