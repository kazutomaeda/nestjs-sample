import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoModel } from './todo.model';

@Injectable()
export class TodoValidator {
  ensureExists(todo: TodoModel | null, id: number): TodoModel {
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} was not found`);
    }
    return todo;
  }
}
