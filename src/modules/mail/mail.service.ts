import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 587;
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      '"Task Management System" <notifications@taskmanagement.com>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transporter configured for host: ${host}`);
    } else {
      this.logger.warn(
        'SMTP credentials are not fully configured. Emails will be logged to console in fallback mode.',
      );
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        });
        this.logger.log(
          `Email sent to ${options.to} [Subject: "${options.subject}"] (MessageId: ${info.messageId})`,
        );
        return true;
      } else {
        this.logger.log(
          `[MOCK EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}"\n${options.text || options.subject}`,
        );
        return true;
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  // ================= TEMPLATED EMAILS =================

  async sendTaskAssignedEmail(data: {
    to: string;
    userName: string;
    taskTitle: string;
    projectName?: string;
    assignerName: string;
    dueDate?: Date;
    priority?: string;
  }) {
    const formattedDueDate = data.dueDate
      ? new Date(data.dueDate).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'No due date specified';

    const html = this.getBaseHtmlTemplate({
      title: 'New Task Assigned',
      preheader: `${data.assignerName} assigned you to "${data.taskTitle}"`,
      badgeColor: '#3b82f6',
      badgeText: 'TASK ASSIGNED',
      body: `
        <p style="font-size: 16px; line-height: 1.5; color: #1f2937; margin-bottom: 20px;">
          Hello <strong>${data.userName}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #4b5563; margin-bottom: 24px;">
          <strong>${data.assignerName}</strong> has assigned a task to you in <strong>${data.projectName || 'a project'}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">${data.taskTitle}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${
              data.priority
                ? `<tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 120px;">Priority:</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #334155; text-transform: uppercase;">${data.priority}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 120px;">Due Date:</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #334155;">${formattedDueDate}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return await this.sendMail({
      to: data.to,
      subject: `New Task Assigned: ${data.taskTitle}`,
      html,
    });
  }

  async sendTaskDueSoonEmail(data: {
    to: string;
    userName: string;
    taskTitle: string;
    projectName?: string;
    dueDate: Date;
  }) {
    const formattedDueDate = new Date(data.dueDate).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const html = this.getBaseHtmlTemplate({
      title: 'Task Due Soon Reminder',
      preheader: `Reminder: "${data.taskTitle}" is due soon`,
      badgeColor: '#f59e0b',
      badgeText: 'DUE SOON (Within 24 Hours)',
      body: `
        <p style="font-size: 16px; line-height: 1.5; color: #1f2937; margin-bottom: 20px;">
          Hello <strong>${data.userName}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #4b5563; margin-bottom: 24px;">
          This is an automated reminder that your assigned task is due within the next 24 hours.
        </p>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;">${data.taskTitle}</h3>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #78350f;">
            <strong>Project:</strong> ${data.projectName || 'Task Workspace'}
          </p>
          <p style="margin: 0; font-size: 14px; color: #b45309; font-weight: bold;">
            <strong>Due Date:</strong> ${formattedDueDate}
          </p>
        </div>
      `,
    });

    return await this.sendMail({
      to: data.to,
      subject: `⏰ Task Due Soon: ${data.taskTitle}`,
      html,
    });
  }

  async sendTaskOverdueEmail(data: {
    to: string;
    userName: string;
    taskTitle: string;
    projectName?: string;
    dueDate: Date;
  }) {
    const formattedDueDate = new Date(data.dueDate).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const html = this.getBaseHtmlTemplate({
      title: 'Task Overdue Alert',
      preheader: `Alert: "${data.taskTitle}" is overdue!`,
      badgeColor: '#ef4444',
      badgeText: 'OVERDUE TASK',
      body: `
        <p style="font-size: 16px; line-height: 1.5; color: #1f2937; margin-bottom: 20px;">
          Hello <strong>${data.userName}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.5; color: #4b5563; margin-bottom: 24px;">
          The following task has passed its scheduled deadline and is marked as overdue.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 18px;">${data.taskTitle}</h3>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #7f1d1d;">
            <strong>Project:</strong> ${data.projectName || 'Task Workspace'}
          </p>
          <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: bold;">
            <strong>Deadline Was:</strong> ${formattedDueDate}
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          Please update the task status or adjust the target completion date.
        </p>
      `,
    });

    return await this.sendMail({
      to: data.to,
      subject: `🚨 Overdue Task Alert: ${data.taskTitle}`,
      html,
    });
  }

  async sendDailyDigestEmail(data: {
    to: string;
    userName: string;
    dueTodayTasks: { title: string; projectName?: string }[];
    overdueTasks: { title: string; projectName?: string }[];
    totalPendingTasks: number;
  }) {
    const dueTodayHtml =
      data.dueTodayTasks.length > 0
        ? `
        <h4 style="margin: 16px 0 8px 0; color: #d97706; font-size: 16px;">Due Today (${data.dueTodayTasks.length})</h4>
        <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #374151;">
          ${data.dueTodayTasks.map((t) => `<li style="margin-bottom: 6px;"><strong>${t.title}</strong> <span style="color: #6b7280; font-size: 13px;">(${t.projectName || 'General'})</span></li>`).join('')}
        </ul>
      `
        : '<p style="color: #6b7280; font-style: italic; margin-bottom: 16px;">No tasks due today 🎉</p>';

    const overdueHtml =
      data.overdueTasks.length > 0
        ? `
        <h4 style="margin: 16px 0 8px 0; color: #dc2626; font-size: 16px;">Overdue Items (${data.overdueTasks.length})</h4>
        <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #374151;">
          ${data.overdueTasks.map((t) => `<li style="margin-bottom: 6px;"><strong>${t.title}</strong> <span style="color: #ef4444; font-size: 13px;">(${t.projectName || 'General'})</span></li>`).join('')}
        </ul>
      `
        : '';

    const html = this.getBaseHtmlTemplate({
      title: 'Daily Task Digest',
      preheader: `Your daily tasks summary: ${data.totalPendingTasks} pending tasks`,
      badgeColor: '#6366f1',
      badgeText: 'DAILY DIGEST',
      body: `
        <p style="font-size: 16px; line-height: 1.5; color: #1f2937; margin-bottom: 12px;">
          Good morning <strong>${data.userName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 20px;">
          Here is your daily task briefing. You currently have <strong>${data.totalPendingTasks}</strong> active/pending task(s).
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          ${dueTodayHtml}
          ${overdueHtml}
        </div>
      `,
    });

    return await this.sendMail({
      to: data.to,
      subject: `📋 Daily Task Digest - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html,
    });
  }

  // ================= SHARED BASE HTML TEMPLATE =================

  private getBaseHtmlTemplate(options: {
    title: string;
    preheader: string;
    badgeColor: string;
    badgeText: string;
    body: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${options.title}</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; }
            .content { padding: 32px 28px; }
            .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div style="display: none; max-height: 0px; overflow: hidden;">
            ${options.preheader}
          </div>
          <div class="container">
            <div class="header">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${options.badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 12px;">
                ${options.badgeText}
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Task Management</h1>
            </div>
            <div class="content">
              ${options.body}
            </div>
            <div class="footer">
              <p style="margin: 0 0 6px 0;">This email was sent automatically by your Task Management System.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Task Management API. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
