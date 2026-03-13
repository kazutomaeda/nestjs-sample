export class FileResponseDto {
  /** ファイルID */
  id: number;

  /** オリジナルファイル名 */
  originalName: string;

  /** MIMEタイプ */
  mimeType: string;

  /** ファイルサイズ（バイト） */
  size: number;

  /** 関連テーブル名 */
  relatedTable: string | null;

  /** 関連レコードID */
  relatedId: number | null;

  /** 署名付きURL */
  url: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
