import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { TaskExistsGuard } from 'src/common/guards/task-exists.guard';
import { WorkspaceRole } from '../workspace-members/entities/workspace-member.entity';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AttachmentOwnershipGuard } from 'src/common/guards/attachment-ownership.guard';
import { Multer } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Task Attachments')
@ApiBearerAuth()
@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/attachments',
)
@UseGuards(
  WorkspaceMemberGuard,
  WorkspaceRolesGuard,
  ProjectExistsGuard,
  TaskExistsGuard,
)
export class TaskAttachmentsController {
  constructor(
    private readonly taskAttachmentsService: TaskAttachmentsService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
  )
  @UseInterceptors(
    FilesInterceptor('files', 5, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async upload(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const response = await this.taskAttachmentsService.uploadAttachments(
      taskId,
      userId,
      files,
    );
    return {
      message: 'Files uploaded successfully',
      data: response,
    };
  }

  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    const files = await this.taskAttachmentsService.findAll(taskId);
    return {
      message: 'Files fetched successfully',
      data: files,
    };
  }

  @Get(':id')
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    const file = await this.taskAttachmentsService.findOne(taskId, id);
    return {
      message: 'File fetched successfully',
      data: file,
    };
  }

  @Delete(':id')
  @UseGuards(AttachmentOwnershipGuard)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    return await this.taskAttachmentsService.remove(taskId, id);
  }
}
