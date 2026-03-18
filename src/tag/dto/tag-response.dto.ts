import { ResourceId } from '../../common/types/id.type';

export class TagResponseDto {
  /** タグ ID */
  id: ResourceId;

  /** テナントID */
  tenantId: ResourceId;

  /** タグ名 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
