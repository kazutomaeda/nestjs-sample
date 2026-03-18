import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { TransactionService } from '../prisma/transaction.service';
import { UserRepository } from '../user/external/user.repository';
import { UserModel } from '../user/user.model';
import { TenantRepository } from './tenant.repository';
import { TenantModel } from './tenant.model';
import { TenantUsecase } from './tenant.usecase';
import { TenantValidator } from './tenant.validator';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';

const mockAbility = new CaslAbilityFactory().createForUser({
  type: 'user',
  sub: 1,
  tenantId: 1,
  role: 'tenant_admin',
});

const mockTenant = new TenantModel({
  id: 1,
  name: '株式会社サンプル',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const mockTenantRepository: Pick<
  TenantRepository,
  'findAll' | 'findById' | 'create' | 'update' | 'delete'
> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockUserRepository: Pick<UserRepository, 'create'> = {
  create: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};

describe('TenantUsecase', () => {
  let usecase: TenantUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TenantUsecase,
        TenantValidator,
        { provide: TenantRepository, useValue: mockTenantRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    usecase = module.get(TenantUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (mockTransactionService.run as jest.Mock).mockImplementation(
      <T>(fn: (tx: unknown) => Promise<T>) => fn({} as never),
    );
  });

  describe('findAll', () => {
    it('テナント一覧を返す', async () => {
      (mockTenantRepository.findAll as jest.Mock).mockResolvedValue([
        mockTenant,
      ]);

      const result = await usecase.findAll(mockAbility);

      expect(result).toEqual([mockTenant]);
      expect(mockTenantRepository.findAll).toHaveBeenCalledWith(mockAbility);
    });
  });

  describe('findOne', () => {
    it('指定IDのテナントを返す', async () => {
      (mockTenantRepository.findById as jest.Mock).mockResolvedValue(
        mockTenant,
      );

      const result = await usecase.findOne(1, mockAbility);

      expect(result).toEqual(mockTenant);
      expect(mockTenantRepository.findById).toHaveBeenCalledWith(
        1,
        mockAbility,
      );
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockTenantRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999, mockAbility)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('トランザクション内でテナントと管理者ユーザーを作成して返す', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      (mockTenantRepository.create as jest.Mock).mockResolvedValue(mockTenant);
      (mockUserRepository.create as jest.Mock).mockResolvedValue(
        new UserModel({
          id: 1,
          tenantId: 1,
          role: 'tenant_admin',
          email: 'admin@example.com',
          name: '田中太郎',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      );

      const result = await usecase.create({
        name: '株式会社サンプル',
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '田中太郎',
        },
      });

      expect(result).toEqual(mockTenant);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTenantRepository.create).toHaveBeenCalledWith(
        { name: '株式会社サンプル' },
        expect.anything(),
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        {
          tenantId: 1,
          role: 'tenant_admin',
          email: 'admin@example.com',
          passwordHash: 'hashedPassword',
          name: '田中太郎',
        },
        expect.anything(),
      );
    });
  });

  describe('update', () => {
    it('存在確認後、トランザクション内でテナントを更新して返す', async () => {
      const updatedTenant = new TenantModel({
        id: 1,
        name: '株式会社更新',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      (mockTenantRepository.findById as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (mockTenantRepository.update as jest.Mock).mockResolvedValue(
        updatedTenant,
      );

      const result = await usecase.update(
        1,
        { name: '株式会社更新' },
        mockAbility,
      );

      expect(result).toEqual(updatedTenant);
      expect(mockTenantRepository.findById).toHaveBeenCalledWith(
        1,
        mockAbility,
      );
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTenantRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(TenantModel),
        expect.anything(),
      );
    });
  });

  describe('remove', () => {
    it('存在確認後、トランザクション内でテナントを削除して返す', async () => {
      (mockTenantRepository.findById as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (mockTenantRepository.delete as jest.Mock).mockResolvedValue(mockTenant);

      const result = await usecase.remove(1, mockAbility);

      expect(result).toEqual(mockTenant);
      expect(mockTenantRepository.findById).toHaveBeenCalledWith(
        1,
        mockAbility,
      );
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTenantRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
    });
  });
});
