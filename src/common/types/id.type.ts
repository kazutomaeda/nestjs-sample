import { ParseIntPipe } from '@nestjs/common';
import { z } from 'zod';

/**
 * リソース ID の型。
 * UUID/ULID 等に変更する場合はここを `string` に変え、
 * ParseIdPipe と zodId() の実装を差し替える。
 */
export type ResourceId = number;

/**
 * コントローラーのパスパラメータ用パイプ。
 * ResourceId が string になったら ParseUUIDPipe 等に差し替える。
 */
export const ParseIdPipe = ParseIntPipe;

/**
 * Zod スキーマ用の ID バリデーション。
 * ResourceId が string になったら z.string().uuid() 等に差し替える。
 */
export const zodId = () => z.coerce.number().int().positive();
