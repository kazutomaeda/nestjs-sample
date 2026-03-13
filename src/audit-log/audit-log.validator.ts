import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogModel } from './audit-log.model';

@Injectable()
export class AuditLogValidator {
  ensureExists(auditLog: AuditLogModel | null, id: number): AuditLogModel {
    if (!auditLog) {
      throw new NotFoundException(`AuditLog with id ${id} was not found`);
    }
    return auditLog;
  }
}
