import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminAuditLogController } from './admin-audit-log.controller';
import { AuditLogController } from './audit-log.controller';
import { AuditLogRepository } from './external/audit-log.repository';
import { AuditLogUsecase } from './audit-log.usecase';
import { AuditLogValidator } from './audit-log.validator';

@Module({
  imports: [AuthModule],
  controllers: [AdminAuditLogController, AuditLogController],
  providers: [AuditLogUsecase, AuditLogValidator, AuditLogRepository],
  exports: [AuditLogRepository],
})
export class AuditLogModule {}
