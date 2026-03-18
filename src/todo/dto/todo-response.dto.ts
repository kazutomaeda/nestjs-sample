import { ResourceId } from '../../common/types/id.type';
import { TagResponseDto } from '../../tag/dto/tag-response.dto';

export class TodoResponseDto {
  /** TODO ID */
  id: ResourceId;

  /** テナントID */
  tenantId: ResourceId;

  /** TODOのタイトル */
  title: string;

  /** 完了フラグ */
  completed: boolean;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** タグ一覧 */
  tags: TagResponseDto[];
}
