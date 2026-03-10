import { Injectable } from '@nestjs/common';
import { TransactionClient } from '../../prisma/prisma.types';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagResolveService {
  constructor(private readonly repository: TagRepository) {}

  async resolveTagIds(
    tagNames: string[],
    tenantId: number,
    tx: TransactionClient,
  ): Promise<number[]> {
    const existing = await this.repository.findByNames(tagNames, tenantId);
    const existingMap = new Map(existing.map((t) => [t.name, t.id]));
    const newNames = tagNames.filter((name) => !existingMap.has(name));
    const created =
      newNames.length > 0
        ? await this.repository.createMany(newNames, tenantId, tx)
        : [];
    return [...existing.map((t) => t.id), ...created.map((t) => t.id)];
  }
}
