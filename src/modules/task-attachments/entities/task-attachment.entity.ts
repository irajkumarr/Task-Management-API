import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/entities/user.entity';

export const StorageProvider = {
  LOCAL: 'local',
  CLOUDINARY: 'cloudinary',
  S3: 's3',
} as const;

export type StorageProvider = (typeof StorageProvider)[keyof typeof StorageProvider];

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalName!: string; // e.g. "design-spec.pdf"

  @Column()
  fileName!: string; // stored name or unique key e.g. "uuid-12345.pdf"

  @Column()
  mimeType!: string; // e.g. "application/pdf", "image/png"

  @Column({ type: 'bigint' })
  size!: number; // file size in bytes

  @Column()
  fileUrl!: string; // Public URL or file path to access the file

  @Column({
    type: 'enum',
    enum: StorageProvider,
    default: StorageProvider.LOCAL,
  })
  provider!: StorageProvider;

  @Column({ nullable: true })
  publicId?: string; // Cloudinary or S3 public ID for deletion

  @Column()
  taskId!: string;

  @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @Column()
  uploadedById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
