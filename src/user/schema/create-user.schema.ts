import { z } from 'zod';
import { requiredString, requiredEmail } from '../../common/schema';

export const createUserSchema = z.object({
  tenantId: z
    .number({
      invalid_type_error: 'テナントIDは数値で入力してください',
    })
    .int('テナントIDは整数で入力してください')
    .positive('テナントIDは正の数で入力してください')
    .optional()
    .openapi({
      description: 'テナントID（system_adminの場合は必須）',
      example: 1,
    }),
  role: z
    .enum(['tenant_admin', 'tenant_user'], {
      required_error: 'ロールは必須です',
      invalid_type_error:
        'ロールは tenant_admin または tenant_user を指定してください',
    })
    .openapi({ description: 'ロール', example: 'tenant_user' }),
  email: requiredEmail('メールアドレス').openapi({
    description: 'メールアドレス',
    example: 'user@example.com',
  }),
  password: requiredString('パスワード')
    .min(8, 'パスワードは8文字以上で入力してください')
    .openapi({ description: 'パスワード', example: 'password123' }),
  name: requiredString('名前').openapi({
    description: '名前',
    example: '山田花子',
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
