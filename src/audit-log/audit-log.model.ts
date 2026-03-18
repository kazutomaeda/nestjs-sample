import { ResourceId } from '../common/types/id.type';

export class AuditLogModel {
  readonly id: ResourceId;
  readonly tenantId: ResourceId;
  readonly actorType: string;
  readonly actorId: ResourceId;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: ResourceId;
  readonly before: object | null;
  readonly after: object | null;
  readonly createdAt: Date;

  constructor(params: {
    id: ResourceId;
    tenantId: ResourceId;
    actorType: string;
    actorId: ResourceId;
    action: string;
    resourceType: string;
    resourceId: ResourceId;
    before: object | null;
    after: object | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.actorType = params.actorType;
    this.actorId = params.actorId;
    this.action = params.action;
    this.resourceType = params.resourceType;
    this.resourceId = params.resourceId;
    this.before = params.before;
    this.after = params.after;
    this.createdAt = params.createdAt;
  }
}
