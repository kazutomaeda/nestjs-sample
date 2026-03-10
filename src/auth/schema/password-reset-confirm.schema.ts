import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const passwordResetConfirmSchema = z.object({
  token: requiredString('トークン'),
  password: requiredString('パスワード').min(8, 'パスワードは8文字以上で入力してください'),
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
