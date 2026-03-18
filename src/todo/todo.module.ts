import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TagModule } from '../tag/tag.module';
import { CommonModule } from '../common/common.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AdminTodoController } from './admin-todo.controller';
import { TodoController } from './todo.controller';
import { TodoRepository } from './todo.repository';
import { AdminTodoUsecase } from './admin-todo.usecase';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';

@Module({
  imports: [AuthModule, TagModule, CommonModule, AuditLogModule],
  controllers: [AdminTodoController, TodoController],
  providers: [AdminTodoUsecase, TodoUsecase, TodoValidator, TodoRepository],
  // exports は external/ 配下のもののみ
})
export class TodoModule {}
