import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'メールアドレス', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'パスワード', example: 'password123' })
  password: string;
}
