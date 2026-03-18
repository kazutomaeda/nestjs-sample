import { ResourceId } from '../../common/types/id.type';

export class AuditLogResponseDto {
  /** 監査ログID */
  id: ResourceId;

  /** テナントID */
  tenantId: ResourceId;

  /** 操作者種別 ('admin' | 'user') */
  actorType: string;

  /** 操作者ID */
  actorId: ResourceId;

  /** 操作種別 (create / update / delete) */
  action: string;

  /** リソース種別 */
  resourceType: string;

  /** リソースID */
  resourceId: ResourceId;

  /** 変更前データ */
  before: object | null;

  /** 変更後データ */
  after: object | null;

  /** 記録日時 */
  createdAt: Date;
}
