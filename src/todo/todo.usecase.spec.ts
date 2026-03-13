import { Test } from '@nestjs/testing';
import { TransactionService } from '../prisma/transaction.service';
import { TagResolveService } from '../tag/external/tag-resolve.service';
import { TodoRepository } from './todo.repository';
import { TodoModel } from './todo.model';
import { TodoUsecase } from './todo.usecase';
import { TodoValidator } from './todo.validator';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';

const mockAbility = new CaslAbilityFactory().createForUser({
  sub: 1,
  tenantId: 1,
  role: 'tenant_admin',
});

const mockTodo = new TodoModel({
  id: 1,
  tenantId: 1,
  title: 'テストTODO',
  completed: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  tags: [],
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

const mockTagResolveService: Pick<TagResolveService, 'resolveTagIds'> = {
  resolveTagIds: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};

describe('TodoUsecase', () => {
  let usecase: TodoUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TodoUsecase,
        TodoValidator,
        { provide: TodoRepository, useValue: mockTodoRepository },
        { provide: TagResolveService, useValue: mockTagResolveService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    usecase = module.get(TodoUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (mockTransactionService.run as jest.Mock).mockImplementation(
      <T>(fn: (tx: unknown) => Promise<T>) => fn({} as never),
    );
  });

  describe('findAll', () => {
    it('TODO一覧を返す', async () => {
      const mockResult = { items: [mockTodo], totalItems: 1 };
      (mockTodoRepository.findAll as jest.Mock).mockResolvedValue(mockResult);

      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const result = await usecase.findAll(mockAbility, query);

      expect(result).toEqual(mockResult);
      expect(mockTodoRepository.findAll).toHaveBeenCalledWith(
        mockAbility,
        query,
      );
    });
  });

  describe('findOne', () => {
    it('指定IDのTODOを返す', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.findOne(1, mockAbility);

      expect(result).toEqual(mockTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, mockAbility);
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999, mockAbility)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('トランザクション内でTODOを作成して返す', async () => {
      (mockTodoRepository.create as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.create(
        { title: 'テストTODO' },
        1,
        mockAbility,
      );

      expect(result).toEqual(mockTodo);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTodoRepository.create).toHaveBeenCalledWith(
        { tenantId: 1, title: 'テストTODO', tagIds: undefined },
        expect.anything(),
      );
    });

    it('タグ名を指定した場合、タグを解決してTODOを作成する', async () => {
      (mockTagResolveService.resolveTagIds as jest.Mock).mockResolvedValue([
        1, 2,
      ]);
      (mockTodoRepository.create as jest.Mock).mockResolvedValue(mockTodo);

      await usecase.create(
        {
          title: 'テストTODO',
          tags: ['既存タグ', '新規タグ'],
        },
        1,
        mockAbility,
      );

      expect(mockTagResolveService.resolveTagIds).toHaveBeenCalledWith(
        ['既存タグ', '新規タグ'],
        1,
        expect.anything(),
      );
      expect(mockTodoRepository.create).toHaveBeenCalledWith(
        { tenantId: 1, title: 'テストTODO', tagIds: [1, 2] },
        expect.anything(),
      );
    });
  });

  describe('update', () => {
    it('存在確認後、トランザクション内でTODOを更新して返す', async () => {
      const updatedTodo = new TodoModel({
        id: 1,
        tenantId: 1,
        title: 'テストTODO',
        completed: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        tags: [],
      });
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.update as jest.Mock).mockResolvedValue(updatedTodo);

      const result = await usecase.update(
        1,
        { completed: true },
        1,
        mockAbility,
      );

      expect(result).toEqual(updatedTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(TodoModel),
        undefined,
        expect.anything(),
      );
    });

    it('タグ名を指定した場合、タグを解決してTODOを更新する', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.update as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.update as jest.Mock).mockResolvedValue(mockTodo);
      (mockTagResolveService.resolveTagIds as jest.Mock).mockResolvedValue([1]);

      await usecase.update(1, { tags: ['既存タグ'] }, 1, mockAbility);

      expect(mockTagResolveService.resolveTagIds).toHaveBeenCalledWith(
        ['既存タグ'],
        1,
        expect.anything(),
      );
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(TodoModel),
        [1],
        expect.anything(),
      );
    });
  });

  describe('remove', () => {
    it('存在確認後、トランザクション内でTODOを削除して返す', async () => {
      (mockTodoRepository.findById as jest.Mock).mockResolvedValue(mockTodo);
      (mockTodoRepository.delete as jest.Mock).mockResolvedValue(mockTodo);

      const result = await usecase.remove(1, mockAbility);

      expect(result).toEqual(mockTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
    });
  });
});
