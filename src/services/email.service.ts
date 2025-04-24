import nodemailer from 'nodemailer';
import { createTestAccount } from 'nodemailer';

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const testAccount = await createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  public async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Task Management System" <noreply@taskmanagement.com>',
        to,
        subject,
        text,
        html: html || text,
      });

      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  public async sendTaskNotification(
    to: string,
    taskTitle: string,
    endTime: string
  ): Promise<void> {
    const subject = `Task End Time Reached: ${taskTitle}`;
    const text = `Your task "${taskTitle}" has reached its end time of ${new Date(
      endTime
    )}`;
    const html = `
      <h2>Task End Time Reached</h2>
      <p>Your task <strong>${taskTitle}</strong> has reached its end time of <strong>${new Date(
      endTime
    )}</strong></p>
      <p>The task will be automatically marked as completed.</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }
}

export default EmailService;
