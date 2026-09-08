import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskStatusDto {
  // @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status!: TaskStatus;
}

export class MoveTaskDto {
  // @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status!: TaskStatus;

  // @ApiProperty({ example: 0, description: 'Position index in the column' })
  @IsNumber()
  @Min(0)
  position!: number;
}

export class AssignTaskDto {
  // @ApiProperty({
  //   example: 'uuid-of-user',
  //   description: 'User ID to assign the task to',
  // })
  @IsString()
  @IsNotEmpty()
  assigneeId!: string;
}
