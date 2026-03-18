import { ResourceId } from '../../../common/types/id.type';
import { UserRole } from '../../types';

export class AuthUserResponseDto {
  /** ユーザーID */
  id: ResourceId;

  /** テナントID */
  tenantId: ResourceId;

  /** ロール */
  role: UserRole;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;
}
