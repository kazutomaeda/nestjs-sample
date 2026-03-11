import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { TransactionService } from '../prisma/transaction.service';
import { UserRepository } from './external/user.repository';
import { UserModel } from './user.model';
import { UserUsecase } from './user.usecase';
import { UserValidator } from './user.validator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAbility = {} as any;

const mockUser = new UserModel({
  id: 1,
  tenantId: 1,
  role: 'tenant_user',
  email: 'user@example.com',
  name: '山田花子',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const mockUserRepository: Pick<
  UserRepository,
  'findAll' | 'findById' | 'findByEmail' | 'create' | 'update' | 'delete'
> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};

describe('UserUsecase', () => {
  let usecase: UserUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserUsecase,
        UserValidator,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    usecase = module.get(UserUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (mockTransactionService.run as jest.Mock).mockImplementation(
      <T>(fn: (tx: unknown) => Promise<T>) => fn({} as never),
    );
  });

  describe('findAll', () => {
    it('ユーザー一覧を返す', async () => {
      (mockUserRepository.findAll as jest.Mock).mockResolvedValue([mockUser]);

      const result = await usecase.findAll(mockAbility);

      expect(result).toEqual([mockUser]);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(mockAbility);
    });
  });

  describe('findOne', () => {
    it('指定IDのユーザーを返す', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await usecase.findOne(1, mockAbility);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1, mockAbility);
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999, mockAbility)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('トランザクション内でユーザーを作成して返す', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await usecase.create(
        {
          role: 'tenant_user',
          email: 'user@example.com',
          password: 'password123',
          name: '山田花子',
        },
        1,
      );

      expect(result).toEqual(mockUser);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        {
          tenantId: 1,
          role: 'tenant_user',
          email: 'user@example.com',
          passwordHash: 'hashedPassword',
          name: '山田花子',
        },
        expect.anything(),
      );
    });

    it('メールアドレスが重複する場合、ConflictExceptionを投げる', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        usecase.create(
          {
            role: 'tenant_user',
            email: 'user@example.com',
            password: 'password123',
            name: '山田花子',
          },
          1,
        ),
      ).rejects.toThrow();
    });

    it('system_adminロールの場合、BadRequestExceptionを投げる', async () => {
      await expect(
        usecase.create(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: 'system_admin' as any,
            email: 'admin@example.com',
            password: 'password123',
            name: '管理者',
          },
          1,
        ),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('存在確認後、トランザクション内でユーザーを更新して返す', async () => {
      const updatedUser = new UserModel({
        id: 1,
        tenantId: 1,
        role: 'tenant_user',
        email: 'user@example.com',
        name: '山田太郎',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await usecase.update(1, { name: '山田太郎' }, mockAbility);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(UserModel),
        expect.anything(),
      );
    });

    it('メールアドレス変更時に重複があればConflictExceptionを投げる', async () => {
      const otherUser = new UserModel({
        id: 2,
        tenantId: 1,
        role: 'tenant_user',
        email: 'other@example.com',
        name: '他のユーザー',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        otherUser,
      );

      await expect(
        usecase.update(1, { email: 'other@example.com' }, mockAbility),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('存在確認後、トランザクション内でユーザーを削除して返す', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepository.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await usecase.remove(1, 99, mockAbility);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
    });

    it('自分自身を削除しようとした場合、BadRequestExceptionを投げる', async () => {
      await expect(usecase.remove(1, 1, mockAbility)).rejects.toThrow();
    });
  });
});
