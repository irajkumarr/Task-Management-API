import { Module } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { TaskCommentsController } from './task-comments.controller';
import { TaskOwnershipGuard } from 'src/common/guards/task-ownership.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { TaskExistsGuard } from 'src/common/guards/task-exists.guard';
import { CommentOwnershipGuard } from 'src/common/guards/comment-ownership.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskComment } from './entities/task-comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, TaskComment, WorkspaceMember]),
  ],
  controllers: [TaskCommentsController],
  providers: [
    TaskCommentsService,
    TaskExistsGuard,
    TaskOwnershipGuard,
    ProjectExistsGuard,
    WorkspaceMemberGuard,
    WorkspaceRolesGuard,
    CommentOwnershipGuard,
  ],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}
