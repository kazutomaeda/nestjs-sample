import { Module } from '@nestjs/common';
import { MailService } from './external/mail.service';
import { SmtpMailTransport } from './smtp-mail.transport';
import { MAIL_TRANSPORT } from './mail-transport.interface';

@Module({
  providers: [
    { provide: MAIL_TRANSPORT, useClass: SmtpMailTransport },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
