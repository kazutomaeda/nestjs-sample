import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailTransport } from '../mail-transport.interface';

describe('MailService', () => {
  let service: MailService;
  let mockTransport: jest.Mocked<MailTransport>;

  beforeEach(() => {
    const configService: Pick<ConfigService, 'get'> = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          SMTP_FROM: 'test@example.com',
        };
        return config[key] ?? defaultValue;
      }),
    };

    mockTransport = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    service = new MailService(
      configService as ConfigService,
      mockTransport,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('メールを送信する', async () => {
      await service.send({
        to: 'user@example.com',
        subject: 'テスト件名',
        text: 'テスト本文',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'テスト件名',
        text: 'テスト本文',
      });
    });
  });
});
