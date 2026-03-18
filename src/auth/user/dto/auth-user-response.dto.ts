import { UserRole } from '../../types';

export class AuthUserResponseDto {
  /** ユーザーID */
  id: number;

  /** テナントID */
  tenantId: number;

  /** ロール */
  role: UserRole;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;
}
