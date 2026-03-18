import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TransactionService } from '../prisma/transaction.service';
import { UserRepository } from '../user/external/user.repository';
import { TenantRepository } from './tenant.repository';
import { TenantModel } from './tenant.model';
import { TenantValidator } from './tenant.validator';
import { CreateTenantInput, UpdateTenantInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { ResourceId } from '../common/types/id.type';

@Injectable()
export class TenantUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly validator: TenantValidator,
  ) {}

  async findAll(ability: AppAbility): Promise<TenantModel[]> {
    return this.tenantRepository.findAll(ability);
  }

  async findOne(id: ResourceId, ability: AppAbility): Promise<TenantModel> {
    return this.validator.ensureExists(
      await this.tenantRepository.findById(id, ability),
      id,
    );
  }

  async create(input: CreateTenantInput): Promise<TenantModel> {
    const passwordHash = await bcrypt.hash(input.admin.password, 10);
    return this.transaction.run(async (tx) => {
      const tenant = await this.tenantRepository.create(
        { name: input.name },
        tx,
      );
      await this.userRepository.create(
        {
          tenantId: tenant.id,
          role: 'tenant_admin',
          email: input.admin.email,
          passwordHash,
          name: input.admin.name,
        },
        tx,
      );
      return tenant;
    });
  }

  async update(
    id: ResourceId,
    input: UpdateTenantInput,
    ability: AppAbility,
  ): Promise<TenantModel> {
    const tenant = this.validator.ensureExists(
      await this.tenantRepository.findById(id, ability),
      id,
    );
    const updated = tenant.withUpdate(input.name);
    return this.transaction.run(async (tx) => {
      return this.tenantRepository.update(id, updated, tx);
    });
  }

  async remove(id: ResourceId, ability: AppAbility): Promise<TenantModel> {
    this.validator.ensureExists(
      await this.tenantRepository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      return this.tenantRepository.delete(id, tx);
    });
  }
}
