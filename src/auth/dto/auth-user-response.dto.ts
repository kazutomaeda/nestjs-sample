import { Role } from '../types';

export class AuthUserResponseDto {
  /** ユーザーID */
  id: number;

  /** テナントID */
  tenantId: number | null;

  /** ロール */
  role: Role;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;
}
