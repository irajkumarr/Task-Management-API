import { Module } from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskExistsGuard } from 'src/common/guards/task-exists.guard';
import { TaskOwnershipGuard } from 'src/common/guards/task-ownership.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { TaskAttachment } from './entities/task-attachment.entity';
import { S3StorageService } from 'src/common/services/storage/s3-storage.service';
import { CloudinaryStorageService } from 'src/common/services/storage/cloudinary-storage.service';
import { AttachmentOwnershipGuard } from 'src/common/guards/attachment-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, WorkspaceMember, TaskAttachment]),
  ],

  controllers: [TaskAttachmentsController],
  providers: [
    TaskAttachmentsService,
    TaskExistsGuard,
    TaskOwnershipGuard,
    ProjectExistsGuard,
    WorkspaceMemberGuard,
    WorkspaceRolesGuard,
    AttachmentOwnershipGuard,
    {
      provide: 'STORAGE_SERVICE',
      useFactory: () => {
        return process.env.STORAGE_PROVIDER === 's3'
          ? new S3StorageService()
          : new CloudinaryStorageService();
      },
    },
  ],
  exports: [TaskAttachmentsService],
})
export class TaskAttachmentsModule {}
