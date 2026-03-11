import { createTenantSchema } from './create-tenant.schema';

describe('createTenantSchema', () => {
  describe('有効なケース', () => {
    it('全フィールド指定で有効', () => {
      const input = {
        name: '株式会社サンプル',
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '田中太郎',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('余分なフィールドは除去される', () => {
      const input = {
        name: '株式会社サンプル',
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '田中太郎',
        },
        extra: 'field',
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: '株式会社サンプル',
          admin: {
            email: 'admin@example.com',
            password: 'password123',
            name: '田中太郎',
          },
        });
      }
    });
  });

  describe('無効なケース', () => {
    it('テナント名が空文字の場合はエラー', () => {
      const input = {
        name: '',
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '田中太郎',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('テナント名は必須です');
      }
    });

    it('テナント名がない場合はエラー', () => {
      const input = {
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '田中太郎',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('adminがない場合はエラー', () => {
      const input = { name: '株式会社サンプル' };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('管理者メールアドレスが不正な場合はエラー', () => {
      const input = {
        name: '株式会社サンプル',
        admin: {
          email: 'invalid-email',
          password: 'password123',
          name: '田中太郎',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('パスワードが8文字未満の場合はエラー', () => {
      const input = {
        name: '株式会社サンプル',
        admin: {
          email: 'admin@example.com',
          password: 'short',
          name: '田中太郎',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは8文字以上で入力してください',
        );
      }
    });

    it('管理者名が空文字の場合はエラー', () => {
      const input = {
        name: '株式会社サンプル',
        admin: {
          email: 'admin@example.com',
          password: 'password123',
          name: '',
        },
      };
      const result = createTenantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
