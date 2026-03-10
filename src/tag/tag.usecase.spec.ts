import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TransactionService } from '../prisma/transaction.service';
import { TagRepository } from './external/tag.repository';
import { TagModel } from './tag.model';
import { TagUsecase } from './tag.usecase';
import { TagValidator } from './tag.validator';

const mockAbility = {} as any;

const mockTag = new TagModel({
  id: 1,
  tenantId: 1,
  name: '重要',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const mockTagRepository: Pick<
  TagRepository,
  'findAll' | 'findById' | 'findByName' | 'create' | 'update' | 'delete'
> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};

describe('TagUsecase', () => {
  let usecase: TagUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TagUsecase,
        TagValidator,
        { provide: TagRepository, useValue: mockTagRepository },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    usecase = module.get(TagUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (mockTransactionService.run as jest.Mock).mockImplementation(
      <T>(fn: (tx: unknown) => Promise<T>) => fn({} as never),
    );
  });

  describe('findAll', () => {
    it('タグ一覧を返す', async () => {
      (mockTagRepository.findAll as jest.Mock).mockResolvedValue([mockTag]);

      const result = await usecase.findAll(mockAbility);

      expect(result).toEqual([mockTag]);
      expect(mockTagRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('指定IDのタグを返す', async () => {
      (mockTagRepository.findById as jest.Mock).mockResolvedValue(mockTag);

      const result = await usecase.findOne(1, mockAbility);

      expect(result).toEqual(mockTag);
      expect(mockTagRepository.findById).toHaveBeenCalledWith(1, mockAbility);
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockTagRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999, mockAbility)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('トランザクション内でタグを作成して返す', async () => {
      (mockTagRepository.findByName as jest.Mock).mockResolvedValue(null);
      (mockTagRepository.create as jest.Mock).mockResolvedValue(mockTag);

      const result = await usecase.create({ name: '重要' }, 1);

      expect(result).toEqual(mockTag);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTagRepository.findByName).toHaveBeenCalledWith('重要', 1);
      expect(mockTagRepository.create).toHaveBeenCalledWith(
        { name: '重要', tenantId: 1 },
        expect.anything(),
      );
    });

    it('同名タグが存在する場合、ConflictExceptionを投げる', async () => {
      (mockTagRepository.findByName as jest.Mock).mockResolvedValue(mockTag);

      await expect(usecase.create({ name: '重要' }, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('存在確認後、トランザクション内でタグを更新して返す', async () => {
      const updatedTag = new TagModel({
        id: 1,
        tenantId: 1,
        name: '緊急',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      (mockTagRepository.findById as jest.Mock).mockResolvedValue(mockTag);
      (mockTagRepository.findByName as jest.Mock).mockResolvedValue(null);
      (mockTagRepository.update as jest.Mock).mockResolvedValue(updatedTag);

      const result = await usecase.update(1, { name: '緊急' }, 1, mockAbility);

      expect(result).toEqual(updatedTag);
      expect(mockTagRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTagRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(TagModel),
        expect.anything(),
      );
    });

    it('同名タグが存在する場合、ConflictExceptionを投げる', async () => {
      (mockTagRepository.findById as jest.Mock).mockResolvedValue(mockTag);
      (mockTagRepository.findByName as jest.Mock).mockResolvedValue(
        new TagModel({
          id: 2,
          tenantId: 1,
          name: '緊急',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      );

      await expect(usecase.update(1, { name: '緊急' }, 1, mockAbility)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('存在確認後、トランザクション内でタグを削除して返す', async () => {
      (mockTagRepository.findById as jest.Mock).mockResolvedValue(mockTag);
      (mockTagRepository.delete as jest.Mock).mockResolvedValue(mockTag);

      const result = await usecase.remove(1, mockAbility);

      expect(result).toEqual(mockTag);
      expect(mockTagRepository.findById).toHaveBeenCalledWith(1, mockAbility);
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockTagRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
    });
  });
});
