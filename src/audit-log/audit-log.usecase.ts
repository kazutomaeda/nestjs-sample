import { Injectable } from '@nestjs/common';
import {
  AuditLogRepository,
  FindAllQuery,
} from './external/audit-log.repository';
import { AuditLogModel } from './audit-log.model';
import { AuditLogValidator } from './audit-log.validator';
import { ListAuditLogInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class AuditLogUsecase {
  constructor(
    private readonly repository: AuditLogRepository,
    private readonly validator: AuditLogValidator,
  ) {}

  async findAll(
    ability: AppAbility,
    input: ListAuditLogInput,
  ): Promise<{ items: AuditLogModel[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      action: input.action,
      resourceType: input.resourceType,
      actorType: input.actorType,
      actorId: input.actorId,
    };
    return this.repository.findAll(ability, query);
  }

  async findOne(id: number, ability: AppAbility): Promise<AuditLogModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }
}
