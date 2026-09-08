import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskComment } from 'src/modules/task-comments/entities/task-comment.entity';
import { WorkspaceRole } from 'src/modules/workspace-members/entities/workspace-member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;
    const memberRole = req.workspaceMember?.role; // set by WorkspaceMemberGuard
    const commentId = req.params.id;

    // ADMINs and OWNERs can edit/delete any comment (moderation)
    if ([WorkspaceRole.ADMIN, WorkspaceRole.OWNER].includes(memberRole)) {
      return true;
    }

    // For MEMBER and VIEWER, check comment author ownership
    const comment = await this.taskCommentRepository.findOne({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit or delete your own comments');
    }

    return true;
  }
}
