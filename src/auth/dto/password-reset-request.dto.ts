import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @ApiProperty({ description: 'メールアドレス', example: 'user@example.com' })
  email: string;
}
