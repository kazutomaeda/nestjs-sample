import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTodoDto {
  @ApiPropertyOptional({
    description: 'TODOのタイトル',
    example: '買い物に行く',
  })
  title?: string;

  @ApiPropertyOptional({ description: '完了フラグ', example: true })
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'タグ名の配列',
    example: ['重要', '買い物'],
    type: [String],
  })
  tags?: string[];
}
