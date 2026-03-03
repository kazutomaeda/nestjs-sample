import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTodoDto {
  /** TODOのタイトル */
  @IsOptional()
  @IsString({ message: 'タイトルは文字列で入力してください' })
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title?: string;

  /** 完了フラグ */
  @IsOptional()
  @IsBoolean({ message: '完了フラグは真偽値で入力してください' })
  completed?: boolean;
}
