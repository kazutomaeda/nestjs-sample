import { NotFoundException } from '@nestjs/common';
import { TodoModel } from './todo.model';
import { TodoValidator } from './todo.validator';

const mockTodo = new TodoModel({
  id: 1,
  title: 'テストTODO',
  completed: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('TodoValidator', () => {
  let validator: TodoValidator;

  beforeEach(() => {
    validator = new TodoValidator();
  });

  describe('ensureExists', () => {
    it('TODOが存在する場合、そのTODOを返す', () => {
      const result = validator.ensureExists(mockTodo, 1);

      expect(result).toEqual(mockTodo);
    });

    it('TODOがnullの場合、NotFoundExceptionを投げる', () => {
      expect(() => validator.ensureExists(null, 999)).toThrow(
        NotFoundException,
      );
    });
  });
});
