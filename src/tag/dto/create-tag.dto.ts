import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'タグ名', example: '重要' })
  name: string;
}
