import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TenantController } from './tenant.controller';
import { TenantRepository } from './tenant.repository';
import { TenantUsecase } from './tenant.usecase';
import { TenantValidator } from './tenant.validator';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [TenantController],
  providers: [TenantUsecase, TenantValidator, TenantRepository],
})
export class TenantModule {}
