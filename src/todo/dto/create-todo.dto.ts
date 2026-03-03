import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({ description: 'TODOのタイトル', example: '買い物に行く' })
  title: string;
}
