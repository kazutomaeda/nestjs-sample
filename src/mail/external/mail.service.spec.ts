import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: mockSendMail,
  }),
}));

describe('MailService', () => {
  let service: MailService;

  beforeEach(() => {
    const configService: Pick<ConfigService, 'get'> = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          SMTP_HOST: 'localhost',
          SMTP_PORT: 1025,
          SMTP_FROM: 'test@example.com',
        };
        return config[key] ?? defaultValue;
      }),
    };
    service = new MailService(configService as ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('メールを送信する', async () => {
      mockSendMail.mockResolvedValue({});

      await service.send({
        to: 'user@example.com',
        subject: 'テスト件名',
        text: 'テスト本文',
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'テスト件名',
        text: 'テスト本文',
      });
    });
  });
});
