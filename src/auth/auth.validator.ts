import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserWithPasswordModel } from './auth.model';
import { PasswordReset } from './auth.entity';

@Injectable()
export class AuthValidator {
  ensureUserExists(
    user: UserWithPasswordModel | null,
  ): UserWithPasswordModel {
    if (!user) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }
    return user;
  }

  ensurePasswordResetValid(
    passwordReset: PasswordReset | null,
  ): PasswordReset {
    if (!passwordReset) {
      throw new BadRequestException('無効なトークンです');
    }
    if (passwordReset.usedAt) {
      throw new BadRequestException('このトークンは既に使用されています');
    }
    if (passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('トークンの有効期限が切れています');
    }
    return passwordReset;
  }

  ensureRefreshTokenValid(
    refreshToken: { expiresAt: Date } | null,
  ): void {
    if (!refreshToken) {
      throw new UnauthorizedException('無効なリフレッシュトークンです');
    }
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('リフレッシュトークンの有効期限が切れています');
    }
  }
}
