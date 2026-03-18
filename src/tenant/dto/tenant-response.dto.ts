import { ResourceId } from '../../common/types/id.type';

export class TenantResponseDto {
  /** テナントID */
  id: ResourceId;

  /** テナント名 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
