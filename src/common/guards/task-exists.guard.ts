import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskExistsGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { projectId, taskId } = req.params;

    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found in this workspace');
    }

    req.task = task;
    return true;
  }
}
