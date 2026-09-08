import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { TaskExistsGuard } from 'src/common/guards/task-exists.guard';
import { CommentOwnershipGuard } from 'src/common/guards/comment-ownership.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FilterCommentsDto } from './dto/filter-comment.dto';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '../workspace-members/entities/workspace-member.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Task Comments')
@ApiBearerAuth()
@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/comments',
)
@UseGuards(
  WorkspaceMemberGuard,
  WorkspaceRolesGuard,
  ProjectExistsGuard,
  TaskExistsGuard,
)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Post()
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
  )
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('id') authorId: string,
    @Body() createTaskCommentDto: CreateTaskCommentDto,
  ) {
    const comment = await this.taskCommentsService.create(
      taskId,
      authorId,
      createTaskCommentDto,
    );
    return {
      message: 'Comment created successfully',
      data: comment,
    };
  }

  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Query() filterCommentDto: FilterCommentsDto,
  ) {
    const response = await this.taskCommentsService.findAll(
      taskId,
      filterCommentDto,
    );
    return {
      message: 'Comments fetched successfully',
      data: response.taskComments,
      meta: response.meta,
    };
  }

  @Get(':id')
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    const comment = await this.taskCommentsService.findOne(taskId, id);
    return {
      message: 'Comment fetched successfully',
      data: comment,
    };
  }

  @Patch(':id')
  @UseGuards(CommentOwnershipGuard)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() updateTaskCommentDto: UpdateTaskCommentDto,
  ) {
    const comment = await this.taskCommentsService.update(
      taskId,
      id,
      updateTaskCommentDto,
    );

    return {
      message: 'Comment updated successfully',
      data: comment,
    };
  }

  @Delete(':id')
  @UseGuards(CommentOwnershipGuard)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    return await this.taskCommentsService.remove(taskId, id);
  }
}
