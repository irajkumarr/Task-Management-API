import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceMember } from 'src/modules/workspace-members/entities/workspace-member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const workspaceId = request.params.workspaceId || request.params.id;
    if (!workspaceId) return true;

    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
      },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    request.workspaceMember = membership;
    return true;
  }
}
