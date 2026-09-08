import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskCommentDto } from './create-task-comment.dto';

export class UpdateTaskCommentDto extends PartialType(CreateTaskCommentDto) {}
