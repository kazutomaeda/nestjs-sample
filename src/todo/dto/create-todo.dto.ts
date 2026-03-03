import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTodoDto {
  /** TODOのタイトル */
  @IsString({ message: 'タイトルは文字列で入力してください' })
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title: string;
}
