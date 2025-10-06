import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { EmailService, EmailConfig, AssignmentEmail } from './service';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should create service with default config', () => {
      emailService = new EmailService();
      expect(emailService).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(
        'No SMTP credentials provided. Email functionality will be mocked.'
      );
    });

    it('should create service with custom config', () => {
      const config: EmailConfig = {
        smtpHost: 'test.smtp.com',
        smtpPort: 587,
        smtpUser: 'test@example.com',
        smtpPass: 'password123',
        fromEmail: 'noreply@test.com',
        fromName: 'Test Secret Santa'
      };
      
      emailService = new EmailService(config);
      expect(emailService).toBeDefined();
    });

    it('should handle environment variables', () => {
      process.env.SMTP_HOST = 'env.smtp.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'env@example.com';
      process.env.SMTP_PASS = 'envpass';
      process.env.FROM_EMAIL = 'from@env.com';
      process.env.FROM_NAME = 'Env Santa';

      emailService = new EmailService();
      expect(emailService).toBeDefined();
    });

    it('should warn when only partial credentials provided', () => {
      const config: EmailConfig = {
        smtpHost: 'test.smtp.com',
        smtpPort: 587
      };
      
      emailService = new EmailService(config);
      expect(console.warn).toHaveBeenCalledWith(
        'No SMTP credentials provided. Email functionality will be mocked.'
      );
    });

    it('should handle transporter creation errors', () => {
      const nodemailer = require('nodemailer');
      const originalCreateTransport = nodemailer.createTransport;
      
      nodemailer.createTransport = jest.fn().mockImplementation(() => {
        throw new Error('SMTP connection failed during initialization');
      });

      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123',
        smtpHost: 'failing.smtp.com'
      };

      emailService = new EmailService(config);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize email transporter:',
        expect.any(Error)
      );
      nodemailer.createTransporter = originalCreateTransport;
    });
  });

  describe('sendAssignmentEmail', () => {
    const mockAssignmentEmail: AssignmentEmail = {
      participantName: 'João Silva',
      participantEmail: 'joao@example.com',
      sessionName: 'Natal 2024',
      giftRecipientName: 'Maria Santos',
      giftRecipientEmail: 'maria@example.com'
    };

    it('should send email in mock mode (no credentials)', async () => {
      emailService = new EmailService();
      
      const result = await emailService.sendAssignmentEmail(mockAssignmentEmail);
      
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '[MOCK EMAIL] Would send email to joao@example.com:'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Subject: Your Secret Santa Assignment for Natal 2024'
      );
      expect(console.log).toHaveBeenCalledWith(
        'You are giving a gift to: Maria Santos (maria@example.com)'
      );
    });

    it('should handle various participant names and session names', async () => {
      emailService = new EmailService();
      
      const testCases = [
        {
          participantName: 'Alice Johnson',
          sessionName: 'Office Party 2024',
          giftRecipientName: 'Bob Wilson'
        },
        {
          participantName: 'Carlos Méndez',
          sessionName: 'Family Christmas Exchange',
          giftRecipientName: 'Ana López'
        },
        {
          participantName: '',
          sessionName: 'Test Session',
          giftRecipientName: 'Test Recipient'
        }
      ];

      for (const testCase of testCases) {
        const email: AssignmentEmail = {
          ...testCase,
          participantEmail: 'test@example.com',
          giftRecipientEmail: 'recipient@example.com'
        };
        
        const result = await emailService.sendAssignmentEmail(email);
        expect(result).toBe(true);
      }
    });
  });

  describe('sendMultipleAssignmentEmails', () => {
    it('should send multiple emails successfully', async () => {
      emailService = new EmailService();
      
      const emails: AssignmentEmail[] = [
        {
          participantName: 'User 1',
          participantEmail: 'user1@example.com',
          sessionName: 'Test Session',
          giftRecipientName: 'User 2',
          giftRecipientEmail: 'user2@example.com'
        },
        {
          participantName: 'User 3',
          participantEmail: 'user3@example.com',
          sessionName: 'Test Session',
          giftRecipientName: 'User 4',
          giftRecipientEmail: 'user4@example.com'
        }
      ];

      const result = await emailService.sendMultipleAssignmentEmails(emails);
      
      expect(result).toEqual({ sent: 2, failed: 0 });
    });

    it('should handle empty email array', async () => {
      emailService = new EmailService();
      
      const result = await emailService.sendMultipleAssignmentEmails([]);
      
      expect(result).toEqual({ sent: 0, failed: 0 });
    });

    it('should handle single email in array', async () => {
      emailService = new EmailService();
      
      const emails: AssignmentEmail[] = [{
        participantName: 'Single User',
        participantEmail: 'single@example.com',
        sessionName: 'Single Test',
        giftRecipientName: 'Single Recipient',
        giftRecipientEmail: 'recipient@example.com'
      }];

      const result = await emailService.sendMultipleAssignmentEmails(emails);
      
      expect(result).toEqual({ sent: 1, failed: 0 });
    });
  });

  describe('edge cases and integration', () => {
    it('should handle special characters in email data', async () => {
      emailService = new EmailService();
      
      const specialEmail: AssignmentEmail = {
        participantName: 'José María Ñoño',
        participantEmail: 'jose.maria@example.com',
        sessionName: 'Intercambio Navideño 2024 🎄',
        giftRecipientName: 'François André',
        giftRecipientEmail: 'francois@example.com'
      };

      const result = await emailService.sendAssignmentEmail(specialEmail);
      expect(result).toBe(true);
    });

    it('should handle very long names and session names', async () => {
      emailService = new EmailService();
      
      const longEmail: AssignmentEmail = {
        participantName: 'Very Long Participant Name That Might Cause Issues In Some Systems',
        participantEmail: 'verylongname@example.com',
        sessionName: 'Very Long Session Name That Should Still Work Fine Without Any Problems',
        giftRecipientName: 'Very Long Recipient Name',
        giftRecipientEmail: 'verylongrecipient@example.com'
      };

      const result = await emailService.sendAssignmentEmail(longEmail);
      expect(result).toBe(true);
    });

    it('should work with different email formats', async () => {
      emailService = new EmailService();
      
      const emailFormats = [
        'simple@example.com',
        'user.name+tag@example.co.uk',
        'test123@subdomain.example.org'
      ];

      for (const email of emailFormats) {
        const assignmentEmail: AssignmentEmail = {
          participantName: 'Test User',
          participantEmail: email,
          sessionName: 'Format Test',
          giftRecipientName: 'Recipient',
          giftRecipientEmail: 'recipient@example.com'
        };

        const result = await emailService.sendAssignmentEmail(assignmentEmail);
        expect(result).toBe(true);
      }
    });
  });

  describe('transporter functionality with mocked nodemailer', () => {
    let mockTransporter: any;

    beforeEach(() => {
      mockTransporter = {
        sendMail: jest.fn()
      };
      
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);
    });

    it('should use real transporter when credentials are provided', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123',
        fromEmail: 'sender@example.com',
        fromName: 'Test Sender'
      };

      emailService = new EmailService(config);
      
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const emailData: AssignmentEmail = {
        participantName: 'Test User',
        participantEmail: 'user@example.com',
        sessionName: 'Test Session',
        giftRecipientName: 'Recipient User',
        giftRecipientEmail: 'recipient@example.com'
      };

      const result = await emailService.sendAssignmentEmail(emailData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Test Sender" <sender@example.com>',
        to: 'user@example.com',
        subject: 'Your Secret Santa Assignment for Test Session',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('Test User')
      });
    });

    it('should handle sendMail failure', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123'
      };

      emailService = new EmailService(config);
      
      const sendError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(sendError);

      const emailData: AssignmentEmail = {
        participantName: 'Test User',
        participantEmail: 'user@example.com',
        sessionName: 'Test Session',
        giftRecipientName: 'Recipient User',
        giftRecipientEmail: 'recipient@example.com'
      };

      const result = await emailService.sendAssignmentEmail(emailData);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email to user@example.com:',
        sendError
      );
    });

    it('should generate proper HTML template content', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123',
        fromEmail: 'noreply@secretsanta.com',
        fromName: 'Secret Santa Bot'
      };

      emailService = new EmailService(config);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'html-test' });

      const emailData: AssignmentEmail = {
        participantName: 'Alice Johnson',
        participantEmail: 'alice@example.com',
        sessionName: 'Office Holiday Party 2024',
        giftRecipientName: 'Bob Wilson',
        giftRecipientEmail: 'bob@example.com'
      };

      await emailService.sendAssignmentEmail(emailData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(callArgs.html).toContain('Alice Johnson');
      expect(callArgs.html).toContain('Office Holiday Party 2024');
      expect(callArgs.html).toContain('Bob Wilson');
      expect(callArgs.html).toContain('bob@example.com');
      expect(callArgs.html).toContain('<!DOCTYPE html>');
      expect(callArgs.html).toContain('Secret Santa Assignment');
      expect(callArgs.html).toContain('Keep this assignment');
      expect(callArgs.html).toContain('SECRET');
      expect(callArgs.html).toContain('font-family: Arial');
      expect(callArgs.html).toContain('background-color');
    });

    it('should generate proper text template content', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123'
      };

      emailService = new EmailService(config);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'text-test' });

      const emailData: AssignmentEmail = {
        participantName: 'Charlie Brown',
        participantEmail: 'charlie@example.com',
        sessionName: 'Family Christmas 2024',
        giftRecipientName: 'Lucy van Pelt',
        giftRecipientEmail: 'lucy@example.com'
      };

      await emailService.sendAssignmentEmail(emailData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(callArgs.text).toContain('Charlie Brown');
      expect(callArgs.text).toContain('Family Christmas 2024');
      expect(callArgs.text).toContain('Lucy van Pelt');
      expect(callArgs.text).toContain('lucy@example.com');
      expect(callArgs.text).toContain('🎁 Secret Santa Assignment');
      expect(callArgs.text).toContain('🎯 Your Gift Recipient:');
      expect(callArgs.text).toContain('Keep this assignment SECRET');
      expect(callArgs.text).toContain('⚠️ Important Reminders:');
      expect(callArgs.text).toContain('Happy gift giving! 🎅');
    });

    it('should handle timeout delay in sendMultipleAssignmentEmails', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123'
      };

      emailService = new EmailService(config);
      
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'bulk-test' });

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      const emails: AssignmentEmail[] = [
        {
          participantName: 'User1',
          participantEmail: 'user1@example.com',
          sessionName: 'Bulk Test',
          giftRecipientName: 'Recipient1',
          giftRecipientEmail: 'recipient1@example.com'
        },
        {
          participantName: 'User2', 
          participantEmail: 'user2@example.com',
          sessionName: 'Bulk Test',
          giftRecipientName: 'Recipient2',
          giftRecipientEmail: 'recipient2@example.com'
        }
      ];

      const result = await emailService.sendMultipleAssignmentEmails(emails);

      expect(result).toEqual({ sent: 2, failed: 0 });
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);

      setTimeoutSpy.mockRestore();
    });

    it('should increment failed counter when sendMail fails in batch', async () => {
      const config: EmailConfig = {
        smtpUser: 'test@example.com',
        smtpPass: 'password123'
      };

      emailService = new EmailService(config);
      
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success-1' })
        .mockRejectedValueOnce(new Error('Send failed'));

      const emails: AssignmentEmail[] = [
        {
          participantName: 'Success User',
          participantEmail: 'success@example.com',
          sessionName: 'Test Batch',
          giftRecipientName: 'Success Recipient',
          giftRecipientEmail: 'success-recipient@example.com'
        },
        {
          participantName: 'Fail User',
          participantEmail: 'fail@example.com',
          sessionName: 'Test Batch',
          giftRecipientName: 'Fail Recipient',
          giftRecipientEmail: 'fail-recipient@example.com'
        }
      ];

      const result = await emailService.sendMultipleAssignmentEmails(emails);

      expect(result).toEqual({ sent: 1, failed: 1 });
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });
});
