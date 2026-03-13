import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
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
  ): Promise<OrderModel> {
    return this.transaction.run(async (tx) => {
      return this.repository.create(
        { tenantId, title: input.title, amount: input.amount, paid: input.paid },
        tx,
      );
    });
  }

  async update(
    id: number,
    input: UpdateOrderInput,
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
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number, ability: AppAbility): Promise<OrderModel> {
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
