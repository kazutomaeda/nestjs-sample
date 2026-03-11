import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const passwordResetConfirmSchema = z.object({
  token: requiredString('トークン').openapi({
    description: 'パスワードリセットトークン',
  }),
  password: requiredString('パスワード')
    .min(8, 'パスワードは8文字以上で入力してください')
    .openapi({ description: '新しいパスワード', example: 'newpassword123' }),
});

export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
