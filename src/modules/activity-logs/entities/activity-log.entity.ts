import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export const ActivityAction = {
  // Tasks
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNED: 'task_assigned',
  TASK_MOVED: 'task_moved',

  // Attachments
  ATTACHMENT_UPLOADED: 'attachment_uploaded',
  ATTACHMENT_DELETED: 'attachment_deleted',

  // Comments
  COMMENT_ADDED: 'comment_added',
  COMMENT_DELETED: 'comment_deleted',

  // Projects
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',

  // Members
  MEMBER_JOINED: 'member_joined',
  MEMBER_REMOVED: 'member_removed',
  MEMBER_ROLE_CHANGED: 'member_role_changed',
} as const;

export type ActivityAction =
  (typeof ActivityAction)[keyof typeof ActivityAction];

export const ActivityEntityType = {
  TASK: 'task',
  PROJECT: 'project',
  WORKSPACE: 'workspace',
  COMMENT: 'comment',
  ATTACHMENT: 'attachment',
  MEMBER: 'member',
} as const;

export type ActivityEntityType =
  (typeof ActivityEntityType)[keyof typeof ActivityEntityType];

@Entity('activity_logs')
@Index(['workspaceId', 'createdAt'])
@Index(['projectId', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action!: ActivityAction;

  @Column({
    type: 'enum',
    enum: ActivityEntityType,
  })
  entityType!: ActivityEntityType;

  @Column()
  entityId!: string; // ID of the task, project, comment, etc.

  @Column()
  description!: string; // e.g. "Alex Rivera changed status of 'Setup Auth' from todo to in_progress"

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>; // snapshot / diff data

  @Column()
  workspaceId!: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;

  @Column({ nullable: true })
  projectId?: string;

  @Column({ nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @CreateDateColumn()
  createdAt!: Date;
}
