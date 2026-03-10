import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagRepository } from './external/tag.repository';
import { TagResolveService } from './external/tag-resolve.service';
import { TagUsecase } from './tag.usecase';
import { TagValidator } from './tag.validator';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TagController],
  providers: [TagUsecase, TagValidator, TagRepository, TagResolveService],
  exports: [TagRepository, TagResolveService],
})
export class TagModule {}
