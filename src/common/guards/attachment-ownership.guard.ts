import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAttachment } from 'src/modules/task-attachments/entities/task-attachment.entity';
import { WorkspaceRole } from 'src/modules/workspace-members/entities/workspace-member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AttachmentOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly taskAttachmentRepository: Repository<TaskAttachment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;
    const memberRole = req.workspaceMember?.role; // set by WorkspaceMemberGuard
    const attachmentId = req.params.id;

    // ADMINs and OWNERs can edit/delete any attachment (moderation)
    if ([WorkspaceRole.ADMIN, WorkspaceRole.OWNER].includes(memberRole)) {
      return true;
    }

    // For MEMBER and VIEWER, check attachment upload ownership
    const attachment = await this.taskAttachmentRepository.findOne({
      where: { id: attachmentId },
      select: { id: true, uploadedById: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.uploadedById !== userId) {
      throw new ForbiddenException(
        'You can only edit or delete your own attachment',
      );
    }

    return true;
  }
}
