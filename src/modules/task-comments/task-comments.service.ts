import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskComment } from './entities/task-comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterCommentsDto } from './dto/filter-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentAddedEvent } from '../notifications/events/comment-added.event';
import { AppEvents } from 'src/common/constants/events.constant';
import { CommentDeletedEvent } from 'src/common/events/app-events';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspaceId: string,
    projectId: string,
    taskId: string,
    authorId: string,
    authorName: string,
    createTaskCommentDto: CreateTaskCommentDto,
  ) {
    const taskComment = this.taskCommentRepository.create({
      ...createTaskCommentDto,
      taskId,
      authorId,
    });
    const saved = await this.taskCommentRepository.save(taskComment);

    const comment = await this.findOne(taskId, saved.id);

    if (comment.task?.assigneeId && comment.task.assigneeId !== authorId) {
      this.eventEmitter.emit(
        AppEvents.COMMENT_ADDED,
        new CommentAddedEvent(
          comment.id,
          taskId,
          comment.task.title,
          projectId,
          workspaceId,
          comment.task.assigneeId,
          authorId,
          authorName || 'Someone',
        ),
      );
    }
    return comment;
  }

  async findAll(taskId: string, filterCommentDto: FilterCommentsDto) {
    const queryBuilder = this.taskCommentRepository
      .createQueryBuilder('taskComment')
      .leftJoinAndSelect('taskComment.author', 'author')
      .select([
        'taskComment.id',
        'taskComment.content',
        'taskComment.taskId',
        'taskComment.createdAt',
        'author.id',
        'author.fullName',
      ])
      .where('taskComment.taskId = :taskId', { taskId });

    const page = Number(filterCommentDto.page) || 1;
    const limit = Number(filterCommentDto.limit) || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const sortOrder = filterCommentDto.sortOrder || 'DESC';
    queryBuilder.orderBy('taskComment.createdAt', sortOrder);

    const [taskComments, totalFilteredTaskComments] =
      await queryBuilder.getManyAndCount();

    const totalPages =
      totalFilteredTaskComments === 0
        ? 1
        : Math.ceil(totalFilteredTaskComments / limit);

    return {
      taskComments,
      meta: {
        page,
        limit,
        total: totalFilteredTaskComments,
        totalPages,
      },
    };
  }

  async findOne(taskId: string, id: string) {
    const taskComment = await this.taskCommentRepository.findOne({
      where: {
        id,
        taskId,
      },
      relations: {
        author: true,
        task: true,
      },
      select: {
        id: true,
        content: true,
        taskId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          fullName: true,
        },
      },
    });
    if (!taskComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return taskComment;
  }

  async update(
    taskId: string,
    id: string,
    updateTaskCommentDto: UpdateTaskCommentDto,
  ) {
    const taskComment = await this.taskCommentRepository.findOne({
      where: { id, taskId },
    });
    if (!taskComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    await this.taskCommentRepository.update(id, updateTaskCommentDto);
    return await this.findOne(taskId, id);
  }

  async remove(
    workspaceId: string,
    projectId: string,
    taskId: string,
    id: string,
    userId: string,
    userName: string,
  ) {
    const taskComment = await this.taskCommentRepository.findOne({
      where: { id, taskId },
    });
    if (!taskComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    await this.taskCommentRepository.softRemove(taskComment);

    this.eventEmitter.emit(
      AppEvents.COMMENT_DELETED,
      new CommentDeletedEvent(
        id,
        taskId,
        projectId,
        workspaceId,
        userId,
        userName,
      ),
    );

    return { message: 'Comment deleted successfully' };
  }
}
