import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;
    const memberRole = req.workspaceMember.role; // set by WorkspaceMemberGuard
    const taskId = req.params.id;

    // ADMINs and OWNERs can edit any task — skip ownership check
    if (['ADMIN', 'OWNER'].includes(memberRole)) return true;

    // For MEMBER and VIEWER, check task ownership
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      select: { createdById: true }, // minimal select — just what we need
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.createdById !== userId) {
      throw new ForbiddenException('You can only edit your own tasks');
    }

    return true;
  }
}
