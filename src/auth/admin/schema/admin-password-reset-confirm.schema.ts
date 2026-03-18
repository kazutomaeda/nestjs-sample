import { z } from 'zod';
import { requiredString } from '../../../common/schema';

export const adminPasswordResetConfirmSchema = z.object({
  token: requiredString('トークン').openapi({
    description: 'パスワードリセットトークン',
  }),
  password: requiredString('パスワード')
    .min(8, 'パスワードは8文字以上で入力してください')
    .openapi({ description: '新しいパスワード', example: 'newpassword123' }),
});

export type AdminPasswordResetConfirmInput = z.infer<
  typeof adminPasswordResetConfirmSchema
>;
