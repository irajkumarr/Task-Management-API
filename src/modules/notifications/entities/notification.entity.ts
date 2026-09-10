import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

export const NotificationType = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_COMMENT_ADDED: 'task_comment_added',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
  WORKSPACE_INVITATION: 'workspace_invitation',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

@Entity('notifications')
@Index(['recipientId', 'isRead']) // Optimizes unread queries
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column()
  title!: string; // e.g. "New Task Assigned"

  @Column()
  message!: string; // e.g. "Alex assigned you to 'Setup Auth'"

  @Column({ default: false })
  isRead!: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  // Metadata JSON for linking to the actual entity (e.g. { taskId, projectId, workspaceId, commentId })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // The user who receives the notification
  @Column()
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  // The user who triggered the action (e.g., Alex)
  @Column({ nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
