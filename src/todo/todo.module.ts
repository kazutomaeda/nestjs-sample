import { Module } from '@nestjs/common';
import { TagModule } from '../tag/tag.module';
import { TodoController } from './todo.controller';
import { TodoRepository } from './todo.repository';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';

@Module({
  imports: [TagModule],
  controllers: [TodoController],
  providers: [TodoUsecase, TodoValidator, TodoRepository],
  // exports は external/ 配下のもののみ
})
export class TodoModule {}
