import { PrismaClient } from '@prisma/client';

export type TransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
