import { updateTenantSchema } from './update-tenant.schema';

describe('updateTenantSchema', () => {
  describe('有効なケース', () => {
    it('テナント名のみで有効', () => {
      const input = { name: '株式会社更新' };
      const result = updateTenantSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('空オブジェクトで有効（部分更新なので）', () => {
      const input = {};
      const result = updateTenantSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('無効なケース', () => {
    it('テナント名が空文字の場合はエラー', () => {
      const input = { name: '' };
      const result = updateTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('テナント名は必須です');
      }
    });

    it('テナント名が文字列でない場合はエラー', () => {
      const input = { name: 123 };
      const result = updateTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
