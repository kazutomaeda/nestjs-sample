import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TodoRepository } from '../repository/todo.repository';
import { TodoModel } from './todo.model';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';

const mockTodo = new TodoModel({
  id: 1,
  title: 'テストTODO',
  completed: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const mockTodoRepository: Pick<
  TodoRepository,
  'findAll' | 'findById' | 'create' | 'update' | 'delete'
> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaService = {
  $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({})),
};

describe('TodoUsecase', () => {
  let usecase: TodoUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TodoUsecase,
        TodoValidator,
        { provide: TodoRepository, useValue: mockTodoRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    usecase = module.get(TodoUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockPrismaService.$transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => fn({}),
    );
  });

  describe('findAll', () => {
    it('TODO一覧を返す', async () => {
      (mockTodoRepository.findAll as jest.Mock).mockResolvedValue([mockTodo]);

      const result = await usecase.findAll();

      expect(result).toEqual([mockTodo]);
      expect(mockTodoRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('指定IDのTODOを返す', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.findOne(1);

      expect(result).toEqual(mockTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1);
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('トランザクション内でTODOを作成して返す', async () => {
      (mockTodoRepository.create as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.create({ title: 'テストTODO' });

      expect(result).toEqual(mockTodo);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTodoRepository.create).toHaveBeenCalledWith(
        { title: 'テストTODO' },
        expect.anything(),
      );
    });
  });

  describe('update', () => {
    it('存在確認後、トランザクション内でTODOを更新して返す', async () => {
      const updatedTodo = new TodoModel({
        id: 1,
        title: 'テストTODO',
        completed: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.update as jest.Mock).mockResolvedValue(updatedTodo);

      const result = await usecase.update(1, { completed: true });

      expect(result).toEqual(updatedTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(TodoModel),
        expect.anything(),
      );
    });
  });

  describe('remove', () => {
    it('存在確認後、トランザクション内でTODOを削除して返す', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.delete as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.remove(1);

      expect(result).toEqual(mockTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
    });
  });
});
