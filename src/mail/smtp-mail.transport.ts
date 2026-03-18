import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailTransport, SendMailParams } from './mail-transport.interface';

@Injectable()
export class SmtpMailTransport implements MailTransport {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = createTransport({
      host,
      port,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async sendMail(params: SendMailParams): Promise<void> {
    await this.transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
  }
}
