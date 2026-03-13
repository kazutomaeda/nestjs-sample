import { Module } from '@nestjs/common';
import { MailService } from './external/mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
