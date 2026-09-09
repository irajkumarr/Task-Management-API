import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  StorageProvider,
  TaskAttachment,
} from './entities/task-attachment.entity';
import { Repository } from 'typeorm';
import * as storageInterface from 'src/common/services/storage/storage.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/constants/events.constant';
import {
  TaskAttachmentDeletedEvent,
  TaskAttachmentUploadedEvent,
} from 'src/common/events/app-events';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TaskAttachmentsService {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly taskAttachmentRepository: Repository<TaskAttachment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @Inject('STORAGE_SERVICE')
    private readonly storageService: storageInterface.IStorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadAttachments(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    userName: string,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please provide at least one file to upload',
      );
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    const uploadPromises = files.map(async (file) => {
      const uploadResult = await this.storageService.uploadFile(
        file,
        'tasks_attachments',
      );
      return this.taskAttachmentRepository.create({
        taskId,
        uploadedById: userId,
        originalName: file.originalname,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        fileUrl: uploadResult.fileUrl,
        publicId: uploadResult.publicId,
        provider:
          process.env.STORAGE_PROVIDER === 's3'
            ? StorageProvider.S3
            : StorageProvider.CLOUDINARY,
      });
    });
    const attachmentsToSave = await Promise.all(uploadPromises);
    const attachments =
      await this.taskAttachmentRepository.save(attachmentsToSave);

    this.eventEmitter.emit(
      AppEvents.TASK_ATTACHMENT_UPLOADED,
      new TaskAttachmentUploadedEvent(
        taskId,
        task?.title || 'Task',
        projectId,
        workspaceId,
        files.length,
        userId,
        userName,
        task?.assigneeId,
      ),
    );

    return attachments;
  }

  async findAll(taskId: string) {
    const attachments = await this.taskAttachmentRepository.find({
      where: {
        taskId,
      },
      relations: {
        uploadedBy: true,
      },
      select: {
        uploadedBy: {
          id: true,
          fullName: true,
        },
      },
    });
    return attachments;
  }

  async findOne(taskId: string, id: string) {
    const attachment = await this.taskAttachmentRepository.findOne({
      where: {
        taskId,
        id,
      },
      relations: {
        uploadedBy: true,
      },
      select: {
        uploadedBy: {
          id: true,
          fullName: true,
        },
      },
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment with id ${id} not found`);
    }
    return attachment;
  }

  async remove(
    workspaceId: string,
    projectId: string,
    taskId: string,
    id: string,
    userId: string,
    userName: string,
  ) {
    const file = await this.findOne(taskId, id);
    if (file.publicId) {
      await this.storageService.deleteFile(file.publicId!);
      await this.taskAttachmentRepository.softRemove(file);
    }

    this.eventEmitter.emit(
      AppEvents.TASK_ATTACHMENT_DELETED,
      new TaskAttachmentDeletedEvent(
        taskId,
        id,
        file.originalName,
        projectId,
        workspaceId,
        userId,
        userName,
      ),
    );

    return {
      message: 'File deleted successfully',
    };
  }
}
