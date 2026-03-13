import { NotFoundException } from '@nestjs/common';
import { FileModel } from './file.model';
import { FileValidator } from './file.validator';

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

describe('FileValidator', () => {
  let validator: FileValidator;

  beforeEach(() => {
    validator = new FileValidator();
  });

  describe('ensureExists', () => {
    it('ファイルが存在する場合、そのファイルを返す', () => {
      const result = validator.ensureExists(mockFile, 1);

      expect(result).toEqual(mockFile);
    });

    it('ファイルがnullの場合、NotFoundExceptionを投げる', () => {
      expect(() => validator.ensureExists(null, 999)).toThrow(
        NotFoundException,
      );
    });
  });
});
