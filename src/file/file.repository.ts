import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { File as FileEntity } from '@prisma/client';
import { FileModel } from './file.model';
import { AppAbility } from '../auth/external/casl-ability.factory';
import { ResourceId } from '../common/types/id.type';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: ResourceId,
    ability: AppAbility,
  ): Promise<FileModel | null> {
    const entity = await this.prisma.file.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).File],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: {
      tenantId: ResourceId;
      key: string;
      originalName: string;
      mimeType: string;
      size: number;
      relatedTable?: string;
      relatedId?: ResourceId;
    },
    tx: TransactionClient,
  ): Promise<FileModel> {
    const entity = await tx.file.create({
      data: {
        tenantId: params.tenantId,
        key: params.key,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size: params.size,
        relatedTable: params.relatedTable ?? null,
        relatedId: params.relatedId ?? null,
      },
    });
    return this.toModel(entity);
  }

  async delete(id: ResourceId, tx: TransactionClient): Promise<FileModel> {
    const entity = await tx.file.delete({
      where: { id },
    });
    return this.toModel(entity);
  }

  private toModel(entity: FileEntity): FileModel {
    return new FileModel({
      id: entity.id,
      tenantId: entity.tenantId,
      key: entity.key,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      relatedTable: entity.relatedTable,
      relatedId: entity.relatedId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
