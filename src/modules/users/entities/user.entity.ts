import { Task } from 'src/modules/tasks/entities/task.entity';
import { WorkspaceMember } from 'src/modules/workspace-members/entities/workspace-member.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const AuthProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export const Role = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export type Role = (typeof Role)[keyof typeof Role];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider!: AuthProvider;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiry?: Date | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  hashedRefreshToken?: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiry?: Date | null;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  ownedWorkspaces!: Workspace[];

  @OneToMany(() => WorkspaceMember, (workspaceMember) => workspaceMember.user)
  workspaceMemberships!: WorkspaceMember[];

  @OneToMany(() => Task, (task) => task.assigneeUser)
  assignedTasks!: Task[];

  @OneToMany(() => Task, (task) => task.createdByUser)
  tasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
