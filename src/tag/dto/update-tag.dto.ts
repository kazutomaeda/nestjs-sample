import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiPropertyOptional({ description: 'タグ名', example: '重要' })
  name?: string;
}
