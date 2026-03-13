export class File {
  id: number;
  tenantId: number;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  relatedTable: string | null;
  relatedId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
