import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { TagRepository } from './external/tag.repository';
import { TagModel } from './tag.model';
import { TagValidator } from './tag.validator';
import { CreateTagInput, UpdateTagInput } from './schema';

@Injectable()
export class TagUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TagRepository,
    private readonly validator: TagValidator,
  ) {}

  async findAll(): Promise<TagModel[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<TagModel> {
    return this.validator.ensureExists(await this.repository.findById(id), id);
  }

  async create(input: CreateTagInput): Promise<TagModel> {
    const existing = await this.repository.findByName(input.name);
    this.validator.ensureNameNotDuplicated(existing, input.name);

    return this.transaction.run((tx) => {
      return this.repository.create({ name: input.name }, tx);
    });
  }

  async update(id: number, input: UpdateTagInput): Promise<TagModel> {
    const tag = this.validator.ensureExists(
      await this.repository.findById(id),
      id,
    );

    if (input.name) {
      const existing = await this.repository.findByName(input.name);
      this.validator.ensureNameNotDuplicated(existing, input.name);
    }

    const updated = tag.withUpdate(input.name);

    return this.transaction.run((tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number): Promise<TagModel> {
    this.validator.ensureExists(await this.repository.findById(id), id);
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
