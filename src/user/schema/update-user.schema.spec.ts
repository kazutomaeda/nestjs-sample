import { updateUserSchema } from './update-user.schema';

describe('updateUserSchema', () => {
  describe('有効なケース', () => {
    it('名前のみで有効', () => {
      const input = { name: '山田太郎' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('メールアドレスのみで有効', () => {
      const input = { email: 'new@example.com' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('ロールのみで有効', () => {
      const input = { role: 'tenant_admin' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('全フィールド指定で有効', () => {
      const input = {
        name: '山田太郎',
        email: 'new@example.com',
        role: 'tenant_admin',
      };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('空オブジェクトで有効（部分更新なので）', () => {
      const input = {};
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('無効なケース', () => {
    it('名前が空文字の場合はエラー', () => {
      const input = { name: '' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('名前は必須です');
      }
    });

    it('メールアドレスが不正な場合はエラー', () => {
      const input = { email: 'invalid-email' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('ロールが不正な場合はエラー', () => {
      const input = { role: 'invalid_role' };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('名前が文字列でない場合はエラー', () => {
      const input = { name: 123 };
      const result = updateUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
