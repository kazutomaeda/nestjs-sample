import { createUserSchema } from './create-user.schema';

describe('createUserSchema', () => {
  describe('有効なケース', () => {
    it('全フィールド指定で有効', () => {
      const input = {
        role: 'tenant_user',
        email: 'user@example.com',
        password: 'password123',
        name: '山田花子',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('tenantId付きで有効', () => {
      const input = {
        tenantId: 1,
        role: 'tenant_admin',
        email: 'admin@example.com',
        password: 'password123',
        name: '田中太郎',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('余分なフィールドは除去される', () => {
      const input = {
        role: 'tenant_user',
        email: 'user@example.com',
        password: 'password123',
        name: '山田花子',
        extra: 'field',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          role: 'tenant_user',
          email: 'user@example.com',
          password: 'password123',
          name: '山田花子',
        });
      }
    });
  });

  describe('無効なケース', () => {
    it('メールアドレスが不正な場合はエラー', () => {
      const input = {
        role: 'tenant_user',
        email: 'invalid-email',
        password: 'password123',
        name: '山田花子',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('パスワードが8文字未満の場合はエラー', () => {
      const input = {
        role: 'tenant_user',
        email: 'user@example.com',
        password: 'short',
        name: '山田花子',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは8文字以上で入力してください',
        );
      }
    });

    it('名前が空文字の場合はエラー', () => {
      const input = {
        role: 'tenant_user',
        email: 'user@example.com',
        password: 'password123',
        name: '',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('ロールが不正な場合はエラー', () => {
      const input = {
        role: 'invalid_role',
        email: 'user@example.com',
        password: 'password123',
        name: '山田花子',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('メールアドレスがない場合はエラー', () => {
      const input = {
        role: 'tenant_user',
        password: 'password123',
        name: '山田花子',
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
