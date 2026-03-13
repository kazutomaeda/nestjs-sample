export class OrderResponseDto {
  /** ID */
  id: number;

  title: string;

  amount: number;

  paid: boolean;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
