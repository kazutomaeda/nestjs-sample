import { PaginationMeta } from '../schema/pagination.schema';

export class PaginatedResponseDto<T> {
  /** データ一覧 */
  items: T[];

  /** ページネーション情報 */
  meta: PaginationMeta;
}
