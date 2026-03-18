import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AdminWithPasswordModel } from '../../admin/admin.model';
import { AdminPasswordReset } from './admin-auth.entity';

@Injectable()
export class AdminAuthValidator {
  ensureAdminExists(
    admin: AdminWithPasswordModel | null,
  ): AdminWithPasswordModel {
    if (!admin) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが正しくありません',
      );
    }
    return admin;
  }

  ensurePasswordResetValid(
    passwordReset: AdminPasswordReset | null,
  ): AdminPasswordReset {
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

  ensureRefreshTokenValid(refreshToken: { expiresAt: Date } | null): void {
    if (!refreshToken) {
      throw new UnauthorizedException('無効なリフレッシュトークンです');
    }
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'リフレッシュトークンの有効期限が切れています',
      );
    }
  }
}
