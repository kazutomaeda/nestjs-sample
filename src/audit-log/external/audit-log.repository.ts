import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { Prisma, AuditLog } from '@prisma/client';
import { AuditLogModel } from '../audit-log.model';
import { AppAbility } from '../../auth/external/casl-ability.factory';
import { ResourceId } from '../../common/types/id.type';

export interface FindAllQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  action?: string;
  resourceType?: string;
  actorType?: string;
  actorId?: number;
}

export interface CreateAuditLogParams {
  tenantId: ResourceId;
  actorType: string;
  actorId: ResourceId;
  action: string;
  resourceType: string;
  resourceId: ResourceId;
  before: object | null;
  after: object | null;
}

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ability: AppAbility,
    query: FindAllQuery,
  ): Promise<{ items: AuditLogModel[]; totalItems: number }> {
    const where: Prisma.AuditLogWhereInput = {
      AND: [
        accessibleBy(ability).AuditLog,
        ...(query.action ? [{ action: query.action }] : []),
        ...(query.resourceType ? [{ resourceType: query.resourceType }] : []),
        ...(query.actorType ? [{ actorType: query.actorType }] : []),
        ...(query.actorId !== undefined ? [{ actorId: query.actorId }] : []),
      ],
    };

    const paginate = query.limit > 0;

    const [entities, totalItems] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(paginate && {
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: entities.map((entity) => this.toModel(entity)),
      totalItems,
    };
  }

  async findById(
    id: ResourceId,
    ability: AppAbility,
  ): Promise<AuditLogModel | null> {
    const entity = await this.prisma.auditLog.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).AuditLog],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: CreateAuditLogParams,
    tx: TransactionClient,
  ): Promise<AuditLogModel> {
    const entity = await tx.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        before: params.before ?? Prisma.JsonNull,
        after: params.after ?? Prisma.JsonNull,
      },
    });
    return this.toModel(entity);
  }

  private toModel(entity: AuditLog): AuditLogModel {
    return new AuditLogModel({
      id: entity.id,
      tenantId: entity.tenantId,
      actorType: entity.actorType,
      actorId: entity.actorId,
      action: entity.action,
      resourceType: entity.resourceType,
      resourceId: entity.resourceId,
      before: entity.before as object | null,
      after: entity.after as object | null,
      createdAt: entity.createdAt,
    });
  }
}
