import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagModel } from './tag.model';
import { TagValidator } from './tag.validator';

const mockTag = new TagModel({
  id: 1,
  name: '重要',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('TagValidator', () => {
  let validator: TagValidator;

  beforeEach(() => {
    validator = new TagValidator();
  });

  describe('ensureExists', () => {
    it('タグが存在する場合、そのタグを返す', () => {
      const result = validator.ensureExists(mockTag, 1);

      expect(result).toEqual(mockTag);
    });

    it('タグがnullの場合、NotFoundExceptionを投げる', () => {
      expect(() => validator.ensureExists(null, 999)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureNameNotDuplicated', () => {
    it('既存タグがnullの場合、例外を投げない', () => {
      expect(() =>
        validator.ensureNameNotDuplicated(null, '新規タグ'),
      ).not.toThrow();
    });

    it('既存タグが存在する場合、ConflictExceptionを投げる', () => {
      expect(() => validator.ensureNameNotDuplicated(mockTag, '重要')).toThrow(
        ConflictException,
      );
    });
  });
});
