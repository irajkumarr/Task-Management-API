import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import {
  Notification,
  NotificationType,
} from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Runs every hour to check for tasks due within the next 24 hours.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDueSoonTasks(): Promise<number> {
    this.logger.log(
      'Running cron: Checking tasks due soon (within 24 hours)...',
    );
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonTasks = await this.tasksRepository.find({
      where: {
        dueDate: Between(now, next24h),
        status: Not(In([TaskStatus.DONE, TaskStatus.CANCELLED])),
        assigneeId: Not(IsNull()),
      },
      relations: { assigneeUser: true, project: true },
    });

    let notifiedCount = 0;

    for (const task of dueSoonTasks) {
      if (!task.assigneeUser || !task.assigneeId) continue;

      // Check if a due_soon notification was already sent in the last 24 hours for this task
      const recentNotification = await this.notificationsRepository
        .createQueryBuilder('n')
        .where('n.recipientId = :recipientId', { recipientId: task.assigneeId })
        .andWhere('n.type = :type', { type: NotificationType.TASK_DUE_SOON })
        .andWhere("n.metadata->>'taskId' = :taskId", { taskId: task.id })
        .andWhere('n.createdAt >= :yesterday', {
          yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getOne();

      if (recentNotification) continue;

      // Create in-app notification
      await this.notificationsService.create({
        type: NotificationType.TASK_DUE_SOON,
        title: 'Task Due Soon',
        message: `Task "${task.title}" is due on ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'}`,
        recipientId: task.assigneeId,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          dueDate: task.dueDate,
        },
      });

      // Send email reminder
      if (task.assigneeUser.email) {
        await this.mailService.sendTaskDueSoonEmail({
          to: task.assigneeUser.email,
          userName: task.assigneeUser.fullName || 'User',
          taskTitle: task.title,
          projectName: task.project?.name,
          dueDate: task.dueDate!,
        });
      }

      notifiedCount++;
    }

    this.logger.log(
      `Due soon check completed. Sent ${notifiedCount} reminders out of ${dueSoonTasks.length} eligible tasks.`,
    );
    return notifiedCount;
  }

  /**
   * Runs every hour to check for overdue tasks.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleOverdueTasks(): Promise<number> {
    this.logger.log('Running cron: Checking overdue tasks...');
    const now = new Date();

    const overdueTasks = await this.tasksRepository.find({
      where: {
        dueDate: LessThan(now),
        status: Not(In([TaskStatus.DONE, TaskStatus.CANCELLED])),
        assigneeId: Not(IsNull()),
      },
      relations: { assigneeUser: true, project: true },
    });

    let alertedCount = 0;

    for (const task of overdueTasks) {
      if (!task.assigneeUser || !task.assigneeId) continue;

      // Check if an overdue notification was already sent in the last 24 hours
      const recentNotification = await this.notificationsRepository
        .createQueryBuilder('n')
        .where('n.recipientId = :recipientId', { recipientId: task.assigneeId })
        .andWhere('n.type = :type', { type: NotificationType.TASK_OVERDUE })
        .andWhere("n.metadata->>'taskId' = :taskId", { taskId: task.id })
        .andWhere('n.createdAt >= :yesterday', {
          yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getOne();

      if (recentNotification) continue;

      // Create in-app notification
      await this.notificationsService.create({
        type: NotificationType.TASK_OVERDUE,
        title: 'Task Overdue',
        message: `Task "${task.title}" has passed its due date and is overdue.`,
        recipientId: task.assigneeId,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          dueDate: task.dueDate,
        },
      });

      // Send email alert
      if (task.assigneeUser.email) {
        await this.mailService.sendTaskOverdueEmail({
          to: task.assigneeUser.email,
          userName: task.assigneeUser.fullName || 'User',
          taskTitle: task.title,
          projectName: task.project?.name,
          dueDate: task.dueDate!,
        });
      }

      alertedCount++;
    }

    this.logger.log(
      `Overdue check completed. Sent ${alertedCount} overdue alerts out of ${overdueTasks.length} overdue tasks.`,
    );
    return alertedCount;
  }

  /**
   * Runs daily at 8:00 AM to send digest emails to all active users with pending tasks.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyDigest(): Promise<number> {
    this.logger.log('Running cron: Sending daily task digest emails...');
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const activeUsers = await this.usersRepository.find({
      where: { isActive: true },
    });

    let sentDigests = 0;

    for (const user of activeUsers) {
      if (!user.email) continue;

      const userPendingTasks = await this.tasksRepository.find({
        where: {
          assigneeId: user.id,
          status: Not(In([TaskStatus.DONE, TaskStatus.CANCELLED])),
        },
        relations: { project: true },
      });

      if (userPendingTasks.length === 0) continue;

      const dueTodayTasks = userPendingTasks.filter(
        (t) =>
          t.dueDate && t.dueDate >= startOfToday && t.dueDate <= endOfToday,
      );

      const overdueTasks = userPendingTasks.filter(
        (t) => t.dueDate && t.dueDate < startOfToday,
      );

      await this.mailService.sendDailyDigestEmail({
        to: user.email,
        userName: user.fullName || 'User',
        dueTodayTasks: dueTodayTasks.map((t) => ({
          title: t.title,
          projectName: t.project?.name,
        })),
        overdueTasks: overdueTasks.map((t) => ({
          title: t.title,
          projectName: t.project?.name,
        })),
        totalPendingTasks: userPendingTasks.length,
      });

      sentDigests++;
    }

    this.logger.log(
      `Daily digest completed. Sent digest emails to ${sentDigests} users.`,
    );
    return sentDigests;
  }
}
