import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskAssignedEvent } from '../notifications/events/task-assigned.event';
import { TaskStatusChangedEvent } from '../notifications/events/task-status-changed.event';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspaceId: string,
    projectId: string,
    userId: string,
    createTaskDto: CreateTaskDto,
  ) {
    //  Verify that the project exists and belongs to this workspace
    const project = await this.projectRepository.findOne({
      where: { id: projectId, workspaceId },
    });
    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to this workspace',
      );
    }
    // If an assigneeId is provided, verify they are a member of this workspace
    if (createTaskDto.assigneeId) {
      const isAssignedUserInWorkspace =
        await this.workspaceMemberRepository.findOne({
          where: {
            workspaceId,
            userId: createTaskDto.assigneeId,
          },
        });
      if (!isAssignedUserInWorkspace) {
        throw new BadRequestException(
          'Assignee is not a member of this workspace',
        );
      }
    }
    // Auto-calculate position for Kanban column
    const highestPositionTask = await this.taskRepository.findOne({
      where: {
        projectId,
        status: (createTaskDto as any).status || 'todo',
      },
      order: { position: 'DESC' },
    });
    const nextPosition = highestPositionTask
      ? highestPositionTask.position + 1
      : 0;
    // Create and save the task
    const task = this.taskRepository.create({
      ...createTaskDto,
      projectId,
      createdById: userId,
      position: nextPosition,
    });
    return await this.taskRepository.save(task);
  }

  async findAll(projectId: string, filterTaskDto: FilterTaskDto) {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId });
    if (filterTaskDto.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filterTaskDto.status,
      });
    }
    if (filterTaskDto.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: filterTaskDto.priority,
      });
    }
    if (filterTaskDto.assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', {
        assigneeId: filterTaskDto.assigneeId,
      });
    }

    if (filterTaskDto.search) {
      queryBuilder.andWhere('LOWER(task.title) LIKE LOWER(:search)', {
        search: `%${filterTaskDto.search}%`,
      });
    }
    if (filterTaskDto.dueDate) {
      queryBuilder.andWhere('task.dueDate = :dueDate', {
        dueDate: filterTaskDto.dueDate,
      });
    }
    const page = Number(filterTaskDto.page) || 1;
    const limit = Number(filterTaskDto.limit) || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    if (filterTaskDto.sortBy) {
      queryBuilder.orderBy(
        'task.' + filterTaskDto.sortBy,
        filterTaskDto.sortOrder,
      );
    }

    const [tasks, totalFilteredTasks] = await queryBuilder.getManyAndCount();

    const totalPages =
      totalFilteredTasks === 0 ? 1 : Math.ceil(totalFilteredTasks / limit);

    return {
      tasks,
      meta: {
        page,
        limit,
        total: totalFilteredTasks,
        totalPages,
      },
    };
  }

  async findOne(projectId: string, id: string) {
    const task = await this.taskRepository.findOne({
      where: {
        id,
        projectId,
      },
      relations: {
        project: {
          workspace: {
            members: true,
          },
        },
        assigneeUser: true,
        createdByUser: true,
      },
      select: {
        assigneeUser: {
          id: true,
          fullName: true,
          email: true,
        },
        createdByUser: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async update(projectId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.taskRepository.update(id, updateTaskDto);
    return await this.findOne(projectId, id);
  }

  async remove(projectId: string, id: string) {
    const task = await this.taskRepository.findOne({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    await this.taskRepository.softRemove(task);
    return { message: 'Task deleted successfully' };
  }

  // Kanban
  async updateStatus(
    workspaceId: string,
    projectId: string,
    id: string,
    status: string,
    actorId: string,
    actorName: string,
  ) {
    const task = await this.taskRepository.findOne({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.taskRepository.update(id, {
      status,
    });
    const updatedTask = await this.findOne(projectId, id);
    if (updatedTask.assigneeId) {
      this.eventEmitter.emit(
        'task.status.changed',
        new TaskStatusChangedEvent(
          task.id,
          task.title,
          task.status, // oldStatus
          updatedTask.status, // newStatus
          projectId, // projectId
          workspaceId || '', // workspaceId
          updatedTask.assigneeId, // recipientId
          actorId ?? '',
          actorName ?? 'A team member',
        ),
      );
    }
    return updatedTask;
  }

  async updatePosition(
    projectId: string,
    id: string,
    data: { status: string; position: number },
  ) {
    const task = await this.taskRepository.findOne({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    await this.taskRepository.update(id, {
      status: data.status,
      position: data.position,
    });
    return await this.findOne(projectId, id);
  }

  async getTaskBoard(projectId: string) {
    const tasks = await this.taskRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });

    const board: Record<string, any[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
      [TaskStatus.CANCELLED]: [],
    };

    // Group tasks into their respective status arrays
    for (const task of tasks) {
      if (board[task.status]) {
        board[task.status].push(task);
      }
    }

    return board;
  }

  async getTaskSummary(projectId: string) {
    const tasks = await this.taskRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });

    const board: Record<string, any[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
      [TaskStatus.CANCELLED]: [],
    };

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;

    const now = new Date();

    for (const task of tasks) {
      // 1. Group tasks by status
      if (board[task.status]) {
        board[task.status].push(task);
      }

      // 2. Calculate metrics
      if (task.status === TaskStatus.DONE) {
        completedTasks++;
      }
      if (task.status === TaskStatus.IN_PROGRESS) {
        inProgressTasks++;
      }

      // Assuming you have a 'dueDate' field on your task entity
      if (
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.CANCELLED
      ) {
        overdueTasks++;
      }
    }

    // 3. Calculate completion rate (avoid division by zero)
    const completionRate =
      totalTasks > 0
        ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%`
        : '0.0%';

    return {
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
      },
      tasks: board,
    };
  }

  async updateAssigne(
    workspaceId: string,
    projectId: string,
    id: string,
    assigneeId: string,
    actorId: string,
    actorName: string,
  ) {
    const task = await this.taskRepository.findOne({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    if (assigneeId) {
      const isMember = await this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: assigneeId },
      });
      if (!isMember) {
        throw new BadRequestException(
          'Assignee is not a member of this workspace',
        );
      }
    }
    await this.taskRepository.update(id, { assigneeId });

    const updatedTask = await this.findOne(projectId, id);
    if (assigneeId) {
      this.eventEmitter.emit(
        'task.assigned',
        new TaskAssignedEvent(
          task.id,
          task.title,
          projectId,
          workspaceId,
          assigneeId,
          actorId || '',
          actorName || 'A team member',
        ),
      );
    }
    return updatedTask;
  }
}
