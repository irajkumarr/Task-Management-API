import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAttachment } from './entities/task-attachment.entity';
import { Repository } from 'typeorm';
import * as storageInterface from 'src/common/services/storage/storage.interface';

@Injectable()
export class TaskAttachmentsService {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly taskAttachmentRepository: Repository<TaskAttachment>,
    @Inject('STORAGE_SERVICE')
    private readonly storageService: storageInterface.IStorageService,
    // private readonly s3StorageService: S3StorageService,
  ) {}

  async uploadAttachments(
    taskId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please provide at least one file to upload',
      );
    }
    // Upload files concurrently to Cloudinary
    const uploadPromises = files.map(async (file) => {
      const uploadResult = await this.storageService.uploadFile(
        file,
        'tasks_attachments',
      );

      //  Map file data and Cloudinary payload directly to your TaskAttachment schema
      return this.taskAttachmentRepository.create({
        taskId,
        uploadedById: userId,
        originalName: file.originalname,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        fileUrl: uploadResult.fileUrl,
        publicId: uploadResult.publicId,
      });
    });

    const attachmentsToSave = await Promise.all(uploadPromises);

    //  Save all attachment rows to the database in a single batch operation
    const attachments =
      await this.taskAttachmentRepository.save(attachmentsToSave);

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

  async remove(taskId: string, id: string) {
    const file = await this.findOne(taskId, id);
    if (file.publicId) {
      await this.storageService.deleteFile(file.publicId!);
      await this.taskAttachmentRepository.softRemove(file);
    }
    return {
      message: 'File deleted successfully',
    };
  }
}
