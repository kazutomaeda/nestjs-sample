import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';

@Module({
  controllers: [TodoController],
  providers: [TodoUsecase, TodoValidator],
  exports: [TodoValidator], // Usecase は公開しない（外部呼び出し禁止）
})
export class TodoModule {}
