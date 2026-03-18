import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { AuditLogRepository } from '../audit-log/external/audit-log.repository';
import { TagRepository } from './external/tag.repository';
import { TagModel } from './tag.model';
import { TagValidator } from './tag.validator';
import { AdminCreateTagInput, UpdateTagInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { ResourceId } from '../common/types/id.type';

@Injectable()
export class AdminTagUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TagRepository,
    private readonly validator: TagValidator,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async findAll(ability: AppAbility): Promise<TagModel[]> {
    return this.repository.findAll(ability);
  }

  async findOne(id: ResourceId, ability: AppAbility): Promise<TagModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: AdminCreateTagInput,
    adminId: ResourceId,
  ): Promise<TagModel> {
    const existing = await this.repository.findByName(
      input.name,
      input.tenantId,
    );
    this.validator.ensureNameNotDuplicated(existing, input.name);

    return this.transaction.run(async (tx) => {
      const tag = await this.repository.create(
        { name: input.name, tenantId: input.tenantId },
        tx,
      );
      await this.auditLogRepository.create(
        {
          tenantId: input.tenantId,
          actorType: 'admin',
          actorId: adminId,
          action: 'create',
          resourceType: 'Tag',
          resourceId: tag.id,
          before: null,
          after: tag.toAuditSnapshot(),
        },
        tx,
      );
      return tag;
    });
  }

  async update(
    id: ResourceId,
    input: UpdateTagInput,
    adminId: ResourceId,
    ability: AppAbility,
  ): Promise<TagModel> {
    const tag = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    if (input.name) {
      const existing = await this.repository.findByName(
        input.name,
        tag.tenantId,
      );
      this.validator.ensureNameNotDuplicated(existing, input.name);
    }

    const updated = tag.withUpdate(input.name);

    return this.transaction.run(async (tx) => {
      const result = await this.repository.update(id, updated, tx);
      await this.auditLogRepository.create(
        {
          tenantId: tag.tenantId,
          actorType: 'admin',
          actorId: adminId,
          action: 'update',
          resourceType: 'Tag',
          resourceId: id,
          before: tag.toAuditSnapshot(),
          after: result.toAuditSnapshot(),
        },
        tx,
      );
      return result;
    });
  }

  async remove(
    id: ResourceId,
    adminId: ResourceId,
    ability: AppAbility,
  ): Promise<TagModel> {
    const tag = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run(async (tx) => {
      const result = await this.repository.delete(id, tx);
      await this.auditLogRepository.create(
        {
          tenantId: tag.tenantId,
          actorType: 'admin',
          actorId: adminId,
          action: 'delete',
          resourceType: 'Tag',
          resourceId: id,
          before: tag.toAuditSnapshot(),
          after: null,
        },
        tx,
      );
      return result;
    });
  }
}
