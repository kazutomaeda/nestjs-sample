import { z } from 'zod';
import { requiredString } from '../../../common/schema';

export const adminLoginSchema = z.object({
  email: requiredString('メールアドレス')
    .email('有効なメールアドレスを入力してください')
    .openapi({ description: 'メールアドレス', example: 'admin@example.com' }),
  password: requiredString('パスワード').openapi({
    description: 'パスワード',
    example: 'password123',
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
