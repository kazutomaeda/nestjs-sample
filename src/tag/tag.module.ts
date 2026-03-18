import { Module } from '@nestjs/common';
import { AdminTagController } from './admin-tag.controller';
import { TagController } from './tag.controller';
import { TagRepository } from './external/tag.repository';
import { TagResolveService } from './external/tag-resolve.service';
import { AdminTagUsecase } from './admin-tag.usecase';
import { TagUsecase } from './tag.usecase';
import { TagValidator } from './tag.validator';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [AdminTagController, TagController],
  providers: [
    AdminTagUsecase,
    TagUsecase,
    TagValidator,
    TagRepository,
    TagResolveService,
  ],
  exports: [TagRepository, TagResolveService],
})
export class TagModule {}
