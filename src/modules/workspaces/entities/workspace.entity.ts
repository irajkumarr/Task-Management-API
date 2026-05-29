import { Project } from 'src/modules/projects/entities/project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { WorkspaceMember } from 'src/modules/workspace-members/entities/workspace-member.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.ownedWorkspaces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(
    () => WorkspaceMember,
    (workspaceMember) => workspaceMember.workspace,
  )
  members!: WorkspaceMember[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Project, (project) => project.workspace)
  projects!: Project[];
}
