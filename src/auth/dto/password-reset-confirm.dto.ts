import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetConfirmDto {
  @ApiProperty({ description: 'パスワードリセットトークン' })
  token: string;

  @ApiProperty({ description: '新しいパスワード', example: 'newpassword123' })
  password: string;
}
