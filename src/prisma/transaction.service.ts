import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionClient } from './prisma.types';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
