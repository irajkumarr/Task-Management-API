import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/constants/events.constant';
import { TaskAssignedEvent } from './events/task-assigned.event';
import { TaskStatusChangedEvent } from './events/task-status-changed.event';
import { CommentAddedEvent } from './events/comment-added.event';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    recipientId: string;
    actorId?: string;
    metadata?: Record<string, any>;
  }) {
    const notification = this.notificationsRepository.create(data);
    return await this.notificationsRepository.save(notification);
  }

  async findAll(userId: string, filterNotificationDto: FilterNotificationsDto) {
    const queryBuilder = this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :userId', { userId });

    if (filterNotificationDto.isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', {
        isRead: filterNotificationDto.isRead,
      });
    }

    if (filterNotificationDto.type) {
      queryBuilder.andWhere('notification.type = :type', {
        type: filterNotificationDto.type,
      });
    }

    const page = Number(filterNotificationDto.page) || 1;
    const limit = Number(filterNotificationDto.limit) || 10;
    queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [notifications, totalFilteredNotifications] =
      await queryBuilder.getManyAndCount();

    const totalPages =
      totalFilteredNotifications === 0
        ? 1
        : Math.ceil(totalFilteredNotifications / limit);

    return {
      notifications,
      meta: {
        page,
        limit,
        total: totalFilteredNotifications,
        totalPages,
      },
    };
  }

  async unreadCount(userId: string) {
    return await this.notificationsRepository.count({
      where: {
        isRead: false,
        recipientId: userId,
      },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationsRepository.findOne({
      where: {
        id,
        recipientId: userId,
      },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    await this.notificationsRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
    return {
      message: 'Notification marked as read',
    };
  }

  async markAllRead(userId: string) {
    await this.notificationsRepository.update(
      { recipientId: userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
    return {
      message: 'All notifications marked as read',
    };
  }

  async remove(userId: string, id: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, recipientId: userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    await this.notificationsRepository.softRemove(notification);
    return { message: 'Notification deleted successfully' };
  }

  // ================= EVENT LISTENERS =================

  @OnEvent(AppEvents.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    if (event.assigneeId === event.actorId) return;
    await this.create({
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${event.actorName} assigned you to "${event.taskTitle}"`,
      recipientId: event.assigneeId,
      actorId: event.actorId,
      metadata: {
        taskId: event.taskId,
        projectId: event.projectId,
        workspaceId: event.workspaceId,
      },
    });
  }

  @OnEvent(AppEvents.TASK_STATUS_CHANGED)
  async handleTaskStatusChanged(event: TaskStatusChangedEvent) {
    if (event.recipientId === event.actorId) return;
    await this.create({
      type: NotificationType.TASK_STATUS_CHANGED,
      title: 'Task Status Updated',
      message: `${event.actorName} moved "${event.taskTitle}" to ${event.newStatus}`,
      recipientId: event.recipientId,
      actorId: event.actorId,
      metadata: {
        taskId: event.taskId,
        projectId: event.projectId,
        workspaceId: event.workspaceId,
      },
    });
  }

  @OnEvent(AppEvents.COMMENT_ADDED)
  async handleCommentAdded(event: CommentAddedEvent) {
    if (event.recipientId === event.authorId) return;
    await this.create({
      type: NotificationType.TASK_COMMENT_ADDED,
      title: 'New Comment on Task',
      message: `${event.authorName} commented on "${event.taskTitle}"`,
      recipientId: event.recipientId,
      actorId: event.authorId,
      metadata: {
        taskId: event.taskId,
        commentId: event.commentId,
        projectId: event.projectId,
        workspaceId: event.workspaceId,
      },
    });
  }
}
