export class UserResponseDto {
  /** ユーザーID */
  id: number;

  /** テナントID */
  tenantId: number | null;

  /** ロール */
  role: string;

  /** メールアドレス */
  email: string;

  /** 名前 */
  name: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
