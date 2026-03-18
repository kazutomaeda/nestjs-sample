import { Test } from '@nestjs/testing';
import { TransactionService } from '../prisma/transaction.service';
import { FileRepository } from './file.repository';
import { FileModel } from './file.model';
import { FileUsecase } from './file.usecase';
import { FileValidator } from './file.validator';
import { FileStorageClient } from './external/file-storage.client';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';

const mockAbility = new CaslAbilityFactory().createForUser({
  type: 'user',
  sub: 1,
  tenantId: 1,
  role: 'tenant_admin',
});

const mockFile = new FileModel({
  id: 1,
  tenantId: 1,
  key: '1/test-uuid.png',
  originalName: 'test.png',
  mimeType: 'image/png',
  size: 1024,
  relatedTable: null,
  relatedId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const mockFileRepository: Pick<
  FileRepository,
  'findById' | 'create' | 'delete'
> = {
  findById: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

const mockStorageClient: Pick<
  FileStorageClient,
  'upload' | 'delete' | 'copy' | 'getSignedUrl'
> = {
  upload: jest.fn(),
  delete: jest.fn(),
  copy: jest.fn(),
  getSignedUrl: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};

describe('FileUsecase', () => {
  let usecase: FileUsecase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FileUsecase,
        FileValidator,
        { provide: FileRepository, useValue: mockFileRepository },
        { provide: FileStorageClient, useValue: mockStorageClient },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    usecase = module.get(FileUsecase);
  });

  afterEach(() => {
    jest.resetAllMocks();
    (mockTransactionService.run as jest.Mock).mockImplementation(
      <T>(fn: (tx: unknown) => Promise<T>) => fn({} as never),
    );
  });

  describe('findOne', () => {
    it('指定IDのファイルを返す', async () => {
      (mockFileRepository.findById as jest.Mock).mockResolvedValue(mockFile);

      const result = await usecase.findOne(1, mockAbility);

      expect(result).toEqual(mockFile);
      expect(mockFileRepository.findById).toHaveBeenCalledWith(1, mockAbility);
    });

    it('存在しないIDの場合、NotFoundExceptionを投げる', async () => {
      (mockFileRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usecase.findOne(999, mockAbility)).rejects.toThrow();
    });
  });

  describe('upload', () => {
    it('ストレージにアップロードしてDBにメタデータを保存する', async () => {
      (mockFileRepository.create as jest.Mock).mockResolvedValue(mockFile);

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
      };

      const result = await usecase.upload(file, {}, 1);

      expect(mockStorageClient.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^1\/.+\.png$/),
        file.buffer,
        'image/png',
      );
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockFileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          originalName: 'test.png',
          mimeType: 'image/png',
          size: 1024,
        }),
        expect.anything(),
      );
      expect(result).toEqual(mockFile);
    });

    it('relatedTable/relatedIdを指定してアップロードできる', async () => {
      (mockFileRepository.create as jest.Mock).mockResolvedValue(mockFile);

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
      };

      await usecase.upload(file, { relatedTable: 'todos', relatedId: 1 }, 1);

      expect(mockFileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          relatedTable: 'todos',
          relatedId: 1,
        }),
        expect.anything(),
      );
    });
  });

  describe('copy', () => {
    it('ストレージ上でコピーしてDBにメタデータを作成する', async () => {
      (mockFileRepository.findById as jest.Mock).mockResolvedValue(mockFile);
      (mockFileRepository.create as jest.Mock).mockResolvedValue({
        ...mockFile,
        id: 2,
        key: '1/new-uuid.png',
      });

      const result = await usecase.copy(
        1,
        { relatedTable: 'todos', relatedId: 2 },
        1,
        mockAbility,
      );

      expect(mockStorageClient.copy).toHaveBeenCalledWith(
        '1/test-uuid.png',
        expect.stringMatching(/^1\/.+\.png$/),
      );
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockFileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          originalName: 'test.png',
          mimeType: 'image/png',
          size: 1024,
          relatedTable: 'todos',
          relatedId: 2,
        }),
        expect.anything(),
      );
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('ストレージから削除してDBのメタデータも削除する', async () => {
      (mockFileRepository.findById as jest.Mock).mockResolvedValue(mockFile);
      (mockFileRepository.delete as jest.Mock).mockResolvedValue(mockFile);

      const result = await usecase.remove(1, mockAbility);

      expect(mockStorageClient.delete).toHaveBeenCalledWith('1/test-uuid.png');
      expect(mockTransactionService.run).toHaveBeenCalled();
      expect(mockFileRepository.delete).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
      expect(result).toEqual(mockFile);
    });
  });

  describe('getSignedUrl', () => {
    it('署名付きURLを返す', async () => {
      (mockStorageClient.getSignedUrl as jest.Mock).mockResolvedValue(
        'https://minio/signed-url',
      );

      const result = await usecase.getSignedUrl('1/test-uuid.png');

      expect(result).toBe('https://minio/signed-url');
      expect(mockStorageClient.getSignedUrl).toHaveBeenCalledWith(
        '1/test-uuid.png',
      );
    });
  });
});
