export class AuditLogModel {
  readonly id: number;
  readonly tenantId: number;
  readonly actorType: string;
  readonly actorId: number;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: number;
  readonly before: object | null;
  readonly after: object | null;
  readonly createdAt: Date;

  constructor(params: {
    id: number;
    tenantId: number;
    actorType: string;
    actorId: number;
    action: string;
    resourceType: string;
    resourceId: number;
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
