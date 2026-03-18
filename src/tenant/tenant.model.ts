import { ResourceId } from '../common/types/id.type';

export class TenantModel {
  readonly id: ResourceId;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: ResourceId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  withUpdate(name?: string): TenantModel {
    return new TenantModel({
      id: this.id,
      name: name ?? this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
