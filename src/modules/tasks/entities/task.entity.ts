import { Project } from 'src/modules/projects/entities/project.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ default: 0 })
  position!: number;

  @Column({ nullable: true })
  dueDate?: Date;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.tasks)
  project!: Project;


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
