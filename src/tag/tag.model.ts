export class TagModel {
  readonly id: number;
  readonly tenantId: number;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    tenantId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  toAuditSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
    };
  }

  withUpdate(name?: string): TagModel {
    return new TagModel({
      id: this.id,
      tenantId: this.tenantId,
      name: name ?? this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
