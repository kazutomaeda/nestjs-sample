import { createTagSchema } from './create-tag.schema';

describe('createTagSchema', () => {
  describe('有効なケース', () => {
    it('タグ名のみで有効', () => {
      const input = { name: '重要' };
      const result = createTagSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: '重要' });
      }
    });

    it('余分なフィールドは除去される', () => {
      const input = { name: '重要', extra: 'field' };
      const result = createTagSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: '重要' });
      }
    });
  });

  describe('無効なケース', () => {
    it('タグ名が空文字の場合はエラー', () => {
      const input = { name: '' };
      const result = createTagSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タグ名は必須です');
      }
    });

    it('タグ名がない場合はエラー', () => {
      const input = {};
      const result = createTagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('タグ名が文字列でない場合はエラー', () => {
      const input = { name: 123 };
      const result = createTagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
