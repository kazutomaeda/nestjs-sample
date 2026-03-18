import { ResourceId } from '../common/types/id.type';

export class FileModel {
  readonly id: ResourceId;
  readonly tenantId: ResourceId;
  readonly key: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly relatedTable: string | null;
  readonly relatedId: ResourceId | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: ResourceId;
    tenantId: ResourceId;
    key: string;
    originalName: string;
    mimeType: string;
    size: number;
    relatedTable: string | null;
    relatedId: ResourceId | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.key = params.key;
    this.originalName = params.originalName;
    this.mimeType = params.mimeType;
    this.size = params.size;
    this.relatedTable = params.relatedTable;
    this.relatedId = params.relatedId;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
