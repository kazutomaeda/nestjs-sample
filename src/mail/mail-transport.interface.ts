export interface SendMailParams {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  sendMail(params: SendMailParams): Promise<void>;
}

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
