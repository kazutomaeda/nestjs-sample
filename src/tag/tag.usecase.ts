import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { TagRepository } from './external/tag.repository';
import { TagModel } from './tag.model';
import { TagValidator } from './tag.validator';
import { CreateTagInput, UpdateTagInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class TagUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TagRepository,
    private readonly validator: TagValidator,
  ) {}

  async findAll(ability: AppAbility): Promise<TagModel[]> {
    return this.repository.findAll(ability);
  }

  async findOne(id: number, ability: AppAbility): Promise<TagModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: CreateTagInput,
    tenantId: number,
  ): Promise<TagModel> {
    const existing = await this.repository.findByName(input.name, tenantId);
    this.validator.ensureNameNotDuplicated(existing, input.name);

    return this.transaction.run((tx) => {
      return this.repository.create({ name: input.name, tenantId }, tx);
    });
  }

  async update(
    id: number,
    input: UpdateTagInput,
    tenantId: number,
    ability: AppAbility,
  ): Promise<TagModel> {
    const tag = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    if (input.name) {
      const existing = await this.repository.findByName(input.name, tenantId);
      this.validator.ensureNameNotDuplicated(existing, input.name);
    }

    const updated = tag.withUpdate(input.name);

    return this.transaction.run((tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number, ability: AppAbility): Promise<TagModel> {
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
