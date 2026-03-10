import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const loginSchema = z.object({
  email: requiredString('メールアドレス').email('有効なメールアドレスを入力してください'),
  password: requiredString('パスワード'),
});

export type LoginInput = z.infer<typeof loginSchema>;
