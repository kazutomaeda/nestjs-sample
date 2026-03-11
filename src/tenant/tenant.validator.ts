import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantModel } from './tenant.model';

@Injectable()
export class TenantValidator {
  ensureExists(tenant: TenantModel | null, id: number): TenantModel {
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} was not found`);
    }
    return tenant;
  }
}
