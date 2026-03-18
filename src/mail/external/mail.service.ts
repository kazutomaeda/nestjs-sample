import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_TRANSPORT, MailTransport } from '../mail-transport.interface';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly from: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {
    this.from = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@example.com',
    );
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  }
}
