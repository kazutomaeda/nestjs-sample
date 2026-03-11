import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserModel } from './user.model';

@Injectable()
export class UserValidator {
  ensureExists(user: UserModel | null, id: number): UserModel {
    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }
    return user;
  }

  ensureEmailNotDuplicated(existing: UserModel | null, email: string): void {
    if (existing) {
      throw new ConflictException(
        `メールアドレス ${email} は既に使用されています`,
      );
    }
  }

  ensureNotSelf(currentUserId: number, targetUserId: number): void {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('自分自身を削除することはできません');
    }
  }

  ensureRoleAllowed(role: string): void {
    if (role === 'system_admin') {
      throw new BadRequestException(
        'system_admin ロールのユーザーは作成できません',
      );
    }
  }
}
