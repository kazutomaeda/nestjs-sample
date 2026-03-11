import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const loginSchema = z.object({
  email: requiredString('メールアドレス')
    .email('有効なメールアドレスを入力してください')
    .openapi({ description: 'メールアドレス', example: 'user@example.com' }),
  password: requiredString('パスワード').openapi({
    description: 'パスワード',
    example: 'password123',
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
