import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TagModule } from '../tag/tag.module';
import { CommonModule } from '../common/common.module';
import { TodoController } from './todo.controller';
import { TodoRepository } from './todo.repository';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';

@Module({
  imports: [AuthModule, TagModule, CommonModule],
  controllers: [TodoController],
  providers: [TodoUsecase, TodoValidator, TodoRepository],
  // exports は external/ 配下のもののみ
})
export class TodoModule {}
