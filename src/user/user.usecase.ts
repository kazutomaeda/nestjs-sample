import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TransactionService } from '../prisma/transaction.service';
import { UserRepository } from './external/user.repository';
import { UserModel } from './user.model';
import { UserValidator } from './user.validator';
import { CreateUserInput, UpdateUserInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { ResourceId } from '../common/types/id.type';

@Injectable()
export class UserUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: UserRepository,
    private readonly validator: UserValidator,
  ) {}

  async findAll(ability: AppAbility): Promise<UserModel[]> {
    return this.repository.findAll(ability);
  }

  async findOne(id: ResourceId, ability: AppAbility): Promise<UserModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: CreateUserInput,
    tenantId: ResourceId,
  ): Promise<UserModel> {
    this.validator.ensureRoleAllowed(input.role);
    const existingUser = await this.repository.findByEmail(input.email);
    this.validator.ensureEmailNotDuplicated(existingUser, input.email);

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.transaction.run(async (tx) => {
      return this.repository.create(
        {
          tenantId,
          role: input.role,
          email: input.email,
          passwordHash,
          name: input.name,
        },
        tx,
      );
    });
  }

  async update(
    id: ResourceId,
    input: UpdateUserInput,
    ability: AppAbility,
  ): Promise<UserModel> {
    const user = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    if (input.email) {
      const existingUser = await this.repository.findByEmail(input.email);
      if (existingUser && existingUser.id !== id) {
        this.validator.ensureEmailNotDuplicated(existingUser, input.email);
      }
    }

    if (input.role) {
      this.validator.ensureRoleAllowed(input.role);
    }

    const updated = user.withUpdate(input.name, input.email, input.role);
    return this.transaction.run(async (tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(
    id: ResourceId,
    currentUserId: ResourceId,
    ability: AppAbility,
  ): Promise<UserModel> {
    this.validator.ensureNotSelf(currentUserId, id);
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
