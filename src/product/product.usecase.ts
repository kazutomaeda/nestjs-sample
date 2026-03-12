import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { ProductRepository, FindAllQuery } from './product.repository';
import { ProductModel } from './product.model';
import { ProductValidator } from './product.validator';
import { CreateProductInput, UpdateProductInput, ListProductInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class ProductUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: ProductRepository,
    private readonly validator: ProductValidator,
  ) {}

  async findAll(
    ability: AppAbility,
    input: ListProductInput,
  ): Promise<{ items: ProductModel[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      // TODO: フィルタ条件を追加
    };
    return this.repository.findAll(ability, query);
  }

  async findOne(id: number, ability: AppAbility): Promise<ProductModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: CreateProductInput,
    tenantId: number,
  ): Promise<ProductModel> {
    return this.transaction.run(async (tx) => {
      return this.repository.create(
        { tenantId, name: input.name },
        tx,
      );
    });
  }

  async update(
    id: number,
    input: UpdateProductInput,
    ability: AppAbility,
  ): Promise<ProductModel> {
    const product = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    const updated = product.withUpdate();

    return this.transaction.run(async (tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number, ability: AppAbility): Promise<ProductModel> {
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
