import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { TaskOwnershipGuard } from 'src/common/guards/task-ownership.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, WorkspaceMember])],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskOwnershipGuard,
    ProjectExistsGuard,
    WorkspaceMemberGuard,
    WorkspaceRolesGuard,
  ],
  exports: [TasksService],
})
export class TasksModule { }
