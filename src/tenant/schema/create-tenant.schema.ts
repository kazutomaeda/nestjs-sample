import { z } from 'zod';
import { requiredString, requiredEmail } from '../../common/schema';

export const createTenantSchema = z.object({
  name: requiredString('テナント名').openapi({
    description: 'テナント名',
    example: '株式会社サンプル',
  }),
  admin: z
    .object({
      email: requiredEmail('管理者メールアドレス').openapi({
        description: '管理者メールアドレス',
        example: 'admin@example.com',
      }),
      password: requiredString('パスワード')
        .min(8, 'パスワードは8文字以上で入力してください')
        .openapi({
          description: '管理者パスワード',
          example: 'password123',
        }),
      name: requiredString('管理者名').openapi({
        description: '管理者名',
        example: '田中太郎',
      }),
    })
    .openapi({ description: '初期管理者ユーザー情報' }),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
