import { ResourceId } from '../../common/types/id.type';

export class FileResponseDto {
  /** ファイルID */
  id: ResourceId;

  /** オリジナルファイル名 */
  originalName: string;

  /** MIMEタイプ */
  mimeType: string;

  /** ファイルサイズ（バイト） */
  size: number;

  /** 関連テーブル名 */
  relatedTable: string | null;

  /** 関連レコードID */
  relatedId: ResourceId | null;

  /** 署名付きURL */
  url: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;
}
