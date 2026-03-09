import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({ description: 'TODOのタイトル', example: '買い物に行く' })
  title: string;

  @ApiPropertyOptional({
    description: 'タグ名の配列',
    example: ['重要', '買い物'],
    type: [String],
  })
  tags?: string[];
}
