import { ResourceId } from '../../common/types/id.type';

export class UserResponseDto {
  /** ユーザーID */
  id: ResourceId;

  /** テナントID */
  tenantId: ResourceId;

  /** ロール */
  role: string;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
