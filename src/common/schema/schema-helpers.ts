import { z } from 'zod';

/**
 * 共通のZodスキーマビルダー
 * 新機能追加時に再利用可能なバリデーションルール
 */

/** 必須文字列（空文字不可） */
export const requiredString = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName}は必須です`,
      invalid_type_error: `${fieldName}は文字列で入力してください`,
    })
    .min(1, `${fieldName}は必須です`);

/** オプショナル文字列（指定時は空文字不可） */
export const optionalString = (fieldName: string) =>
  z
    .string({
      invalid_type_error: `${fieldName}は文字列で入力してください`,
    })
    .min(1, `${fieldName}は必須です`)
    .optional();

/** オプショナルブール値 */
export const optionalBoolean = (fieldName: string) =>
  z
    .boolean({
      invalid_type_error: `${fieldName}は真偽値で入力してください`,
    })
    .optional();

/** 正の整数ID */
export const positiveInt = (fieldName: string) =>
  z
    .number({
      required_error: `${fieldName}は必須です`,
      invalid_type_error: `${fieldName}は数値で入力してください`,
    })
    .int(`${fieldName}は整数で入力してください`)
    .positive(`${fieldName}は正の数で入力してください`);

/** 日付文字列（ISO8601形式） */
export const dateString = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName}は必須です`,
      invalid_type_error: `${fieldName}は文字列で入力してください`,
    })
    .datetime({
      message: `${fieldName}は有効な日付形式で入力してください`,
    });

/** オプショナル日付文字列 */
export const optionalDateString = (fieldName: string) =>
  dateString(fieldName).optional();
