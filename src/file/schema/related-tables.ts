import { Prisma } from '@prisma/client';

export const RELATED_TABLES = Prisma.dmmf.datamodel.models
  .map((m) => m.dbName ?? m.name.toLowerCase())
  .filter((name) => name !== 'files') as [string, ...string[]];

export type RelatedTable = (typeof RELATED_TABLES)[number];
