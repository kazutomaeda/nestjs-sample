import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(1, '名前は必須です'),
    age: z.number().min(0, '年齢は0以上です').optional(),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  describe('transform', () => {
    it('有効なデータはそのまま返す', () => {
      const input = { name: 'テスト', age: 20 };
      const result = pipe.transform(input);
      expect(result).toEqual(input);
    });

    it('optionalフィールドがなくても通る', () => {
      const input = { name: 'テスト' };
      const result = pipe.transform(input);
      expect(result).toEqual(input);
    });

    it('余分なフィールドは除去される', () => {
      const input = { name: 'テスト', extra: 'field' };
      const result = pipe.transform(input);
      expect(result).toEqual({ name: 'テスト' });
    });

    it('必須フィールドがない場合はBadRequestExceptionをスロー', () => {
      const input = { age: 20 };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
    });

    it('バリデーションエラー時にエラー詳細を含む', () => {
      const input = { name: '' };
      try {
        pipe.transform(input);
        fail('Expected BadRequestException');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect(response).toHaveProperty('errors');
        expect((response as Record<string, unknown>).errors).toHaveProperty(
          'name',
        );
      }
    });

    it('型が異なる場合はBadRequestExceptionをスロー', () => {
      const input = { name: 123 };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
    });
  });
});
