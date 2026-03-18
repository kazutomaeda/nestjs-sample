import { ResourceId } from '../../../common/types/id.type';

export class AdminAuthResponseDto {
  /** 管理者ID */
  id: ResourceId;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;
}
