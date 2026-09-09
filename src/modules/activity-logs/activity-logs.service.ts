import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityAction,
  ActivityEntityType,
  ActivityLog,
} from './entities/activity-log.entity';
import { FilterActivityLogsDto } from './dto/filter-activity-logs.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/constants/events.constant';
import { TaskAssignedEvent } from '../notifications/events/task-assigned.event';
import { TaskStatusChangedEvent } from '../notifications/events/task-status-changed.event';
import { CommentAddedEvent } from '../notifications/events/comment-added.event';
import {
  CommentDeletedEvent,
  MemberJoinedEvent,
  MemberRemovedEvent,
  MemberRoleChangedEvent,
  ProjectCreatedEvent,
  ProjectDeletedEvent,
  ProjectUpdatedEvent,
  TaskAttachmentDeletedEvent,
  TaskAttachmentUploadedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskMovedEvent,
  TaskUpdatedEvent,
} from 'src/common/events/app-events';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(data: {
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: string;
    description: string;
    workspaceId: string;
    projectId?: string;
    actorId?: string;
    details?: Record<string, any>;
  }) {
    const log = this.activityLogRepository.create(data);
    return await this.activityLogRepository.save(log);
  }

  async findAll(workspaceId: string, filterDto: FilterActivityLogsDto) {
    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .select([
        'log.id',
        'log.action',
        'log.entityType',
        'log.entityId',
        'log.description',
        'log.details',
        'log.workspaceId',
        'log.projectId',
        'log.createdAt',
        'actor.id',
        'actor.fullName',
      ])
      .where('log.workspaceId = :workspaceId', { workspaceId });

    if (filterDto.projectId) {
      queryBuilder.andWhere('log.projectId = :projectId', {
        projectId: filterDto.projectId,
      });
    }

    if (filterDto.action) {
      queryBuilder.andWhere('log.action = :action', {
        action: filterDto.action,
      });
    }

    if (filterDto.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', {
        entityType: filterDto.entityType,
      });
    }

    if (filterDto.entityId) {
      queryBuilder.andWhere('log.entityId = :entityId', {
        entityId: filterDto.entityId,
      });
    }

    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 20;
    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // ================= TASK LISTENERS =================

  @OnEvent(AppEvents.TASK_CREATED)
  async handleTaskCreated(event: TaskCreatedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_CREATED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} created task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log task.created activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_ASSIGNED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} assigned task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
        details: {
          assigneeId: event.assigneeId,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log task.assigned activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_STATUS_CHANGED)
  async handleTaskStatusChanged(event: TaskStatusChangedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_STATUS_CHANGED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} changed status of task "${event.taskTitle}" from ${event.oldStatus} to ${event.newStatus}`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
        details: {
          oldStatus: event.oldStatus,
          newStatus: event.newStatus,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log task.status.changed activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_MOVED)
  async handleTaskMoved(event: TaskMovedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_MOVED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} moved task "${event.taskTitle}" in column ${event.status}`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
        details: {
          status: event.status,
          position: event.position,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log task.moved activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_UPDATED)
  async handleTaskUpdated(event: TaskUpdatedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_UPDATED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} updated task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
        details: event.changes,
      });
    } catch (err) {
      this.logger.error('Failed to log task.updated activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_DELETED)
  async handleTaskDeleted(event: TaskDeletedEvent) {
    try {
      await this.create({
        action: ActivityAction.TASK_DELETED,
        entityType: ActivityEntityType.TASK,
        entityId: event.taskId,
        description: `${event.actorName} deleted task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log task.deleted activity', err);
    }
  }

  // ================= ATTACHMENT LISTENERS =================

  @OnEvent(AppEvents.TASK_ATTACHMENT_UPLOADED)
  async handleAttachmentUploaded(event: TaskAttachmentUploadedEvent) {
    try {
      await this.create({
        action: ActivityAction.ATTACHMENT_UPLOADED,
        entityType: ActivityEntityType.ATTACHMENT,
        entityId: event.taskId,
        description: `${event.actorName} uploaded ${event.fileCount} attachment(s) to task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log attachment.uploaded activity', err);
    }
  }

  @OnEvent(AppEvents.TASK_ATTACHMENT_DELETED)
  async handleAttachmentDeleted(event: TaskAttachmentDeletedEvent) {
    try {
      await this.create({
        action: ActivityAction.ATTACHMENT_DELETED,
        entityType: ActivityEntityType.ATTACHMENT,
        entityId: event.attachmentId,
        description: `${event.actorName} deleted attachment "${event.originalName}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log attachment.deleted activity', err);
    }
  }

  // ================= COMMENT LISTENERS =================

  @OnEvent(AppEvents.COMMENT_ADDED)
  async handleCommentAdded(event: CommentAddedEvent) {
    try {
      await this.create({
        action: ActivityAction.COMMENT_ADDED,
        entityType: ActivityEntityType.COMMENT,
        entityId: event.commentId,
        description: `${event.authorName} commented on task "${event.taskTitle}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.authorId,
      });
    } catch (err) {
      this.logger.error('Failed to log comment.added activity', err);
    }
  }

  @OnEvent(AppEvents.COMMENT_DELETED)
  async handleCommentDeleted(event: CommentDeletedEvent) {
    try {
      await this.create({
        action: ActivityAction.COMMENT_DELETED,
        entityType: ActivityEntityType.COMMENT,
        entityId: event.commentId,
        description: `${event.actorName} deleted a comment on task`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log comment.deleted activity', err);
    }
  }

  // ================= PROJECT LISTENERS =================

  @OnEvent(AppEvents.PROJECT_CREATED)
  async handleProjectCreated(event: ProjectCreatedEvent) {
    try {
      await this.create({
        action: ActivityAction.PROJECT_CREATED,
        entityType: ActivityEntityType.PROJECT,
        entityId: event.projectId,
        description: `${event.actorName} created project "${event.projectName}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log project.created activity', err);
    }
  }

  @OnEvent(AppEvents.PROJECT_UPDATED)
  async handleProjectUpdated(event: ProjectUpdatedEvent) {
    try {
      await this.create({
        action: ActivityAction.PROJECT_UPDATED,
        entityType: ActivityEntityType.PROJECT,
        entityId: event.projectId,
        description: `${event.actorName} updated project "${event.projectName}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log project.updated activity', err);
    }
  }

  @OnEvent(AppEvents.PROJECT_DELETED)
  async handleProjectDeleted(event: ProjectDeletedEvent) {
    try {
      await this.create({
        action: ActivityAction.PROJECT_DELETED,
        entityType: ActivityEntityType.PROJECT,
        entityId: event.projectId,
        description: `${event.actorName} deleted project "${event.projectName}"`,
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log project.deleted activity', err);
    }
  }

  // ================= MEMBER LISTENERS =================

  @OnEvent(AppEvents.MEMBER_JOINED)
  async handleMemberJoined(event: MemberJoinedEvent) {
    try {
      await this.create({
        action: ActivityAction.MEMBER_JOINED,
        entityType: ActivityEntityType.MEMBER,
        entityId: event.userId,
        description: `${event.userName} joined the workspace as ${event.role}`,
        workspaceId: event.workspaceId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log member.joined activity', err);
    }
  }

  @OnEvent(AppEvents.MEMBER_ROLE_CHANGED)
  async handleMemberRoleChanged(event: MemberRoleChangedEvent) {
    try {
      await this.create({
        action: ActivityAction.MEMBER_ROLE_CHANGED,
        entityType: ActivityEntityType.MEMBER,
        entityId: event.userId,
        description: `${event.actorName} changed ${event.userName}'s role from ${event.oldRole} to ${event.newRole}`,
        workspaceId: event.workspaceId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log member.role_changed activity', err);
    }
  }

  @OnEvent(AppEvents.MEMBER_REMOVED)
  async handleMemberRemoved(event: MemberRemovedEvent) {
    try {
      await this.create({
        action: ActivityAction.MEMBER_REMOVED,
        entityType: ActivityEntityType.MEMBER,
        entityId: event.userId,
        description: `${event.actorName} removed ${event.userName} from the workspace`,
        workspaceId: event.workspaceId,
        actorId: event.actorId,
      });
    } catch (err) {
      this.logger.error('Failed to log member.removed activity', err);
    }
  }
}
