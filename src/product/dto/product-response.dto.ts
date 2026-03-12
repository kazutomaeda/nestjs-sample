export class ProductResponseDto {
  /** ID */
  id: number;

  /** 名称 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  // TODO: ドメインに合わせてフィールドを追加
}
