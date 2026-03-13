import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderUsecase } from './order.usecase';
import { OrderValidator } from './order.validator';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [OrderController],
  providers: [OrderUsecase, OrderValidator, OrderRepository],
  // exports は external/ 配下のもののみ
})
export class OrderModule {}
