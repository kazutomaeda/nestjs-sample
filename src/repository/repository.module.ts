import { Global, Module } from '@nestjs/common';
import { TodoRepository } from './todo.repository';

@Global()
@Module({
  providers: [TodoRepository],
  exports: [TodoRepository],
})
export class RepositoryModule {}
