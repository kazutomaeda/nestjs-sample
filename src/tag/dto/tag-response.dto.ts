export class TagResponseDto {
  /** タグ ID */
  id: number;

  /** テナントID */
  tenantId: number;

  /** タグ名 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
