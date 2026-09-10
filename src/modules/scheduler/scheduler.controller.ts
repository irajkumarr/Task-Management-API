import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaskSchedulerService } from './task-scheduler.service';
import { MailService } from '../mail/mail.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Scheduler & Automation')
@ApiBearerAuth()
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: TaskSchedulerService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  @Post('trigger-due-soon')
  @ApiOperation({ summary: 'Manually run due soon tasks check' })
  async triggerDueSoon() {
    const count = await this.schedulerService.handleDueSoonTasks();
    return {
      message: `Due soon task check completed successfully.`,
      remindersSent: count,
    };
  }

  @Post('trigger-overdue')
  @ApiOperation({ summary: 'Manually run overdue tasks check' })
  async triggerOverdue() {
    const count = await this.schedulerService.handleOverdueTasks();
    return {
      message: `Overdue task check completed successfully.`,
      alertsSent: count,
    };
  }

  @Post('trigger-daily-digest')
  @ApiOperation({ summary: 'Manually run daily digest dispatch' })
  async triggerDailyDigest() {
    const count = await this.schedulerService.handleDailyDigest();
    return {
      message: `Daily digest dispatch completed successfully.`,
      digestsSent: count,
    };
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send a test email to the authenticated user' })
  async testEmail(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findOne(userId);
    const success = await this.mailService.sendMail({
      to: user.email,
      subject: '🧪 Test Email from Task Management System',
      html: `
        <h2>Email Test Successful!</h2>
        <p>Hello <strong>${user.fullName || user.email}</strong>,</p>
        <p>This is a confirmation that your email notification service is working properly.</p>
      `,
    });
    return {
      success,
      message: success
        ? `Test email sent to ${user.email}`
        : `Failed to send test email to ${user.email}`,
    };
  }
}
