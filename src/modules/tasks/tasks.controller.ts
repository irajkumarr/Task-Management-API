import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { FilterTaskDto } from './dto/filter-task.dto';

@Controller('workspaces/:workspaceid/projects/:projectId/tasks')
@UseGuards(WorkspaceMemberGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(
      workspaceId,
      projectId,
      userId,
      createTaskDto,
    );
    return {
      message: 'Task created successfully',
      data: task,
    };
  }

  @Get()
  async findAll(filterTaskDto: FilterTaskDto) {
    const tasks = await this.tasksService.findAll(filterTaskDto);
    return {
      message: 'Tasks fetched successfully',
      data: tasks,
    };
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const task = await this.tasksService.findOne(projectId, id);
    return {
      message: 'Task fetched successfully',
      data: task,
    };
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(projectId, id, updateTaskDto);
    return {
      message: 'Task updated successfully',
      data: task,
    };
  }

  @Delete(':id')
  async remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    await this.tasksService.remove(projectId, id);
    return {
      message: 'Task deleted successfully',
    };
  }

  // Kanban endpoints
  @Patch(':id/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() status: string,
  ) {
    const task = await this.tasksService.updateStatus(projectId, id, status);
    return {
      message: 'Task status updated successfully',
      data: task,
    };
  }

  @Patch(':id/move')
  async updatePosition(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() data: { status: string; position: number },
  ) {
    const task = await this.tasksService.updatePosition(projectId, id, data);
    return {
      message: 'Task status updated successfully',
      data: task,
    };
  }

  @Get('board')
  async getTaskBoard(@Param('projectId') projectId: string) {
    const tasks = await this.tasksService.getTaskBoard(projectId);
    return {
      message: 'Tasks board fetched successfully',
      data: tasks,
    };
  }

  @Get('summary')
  async getTaskSummary(@Param('projectId') projectId: string) {
    const summary = await this.tasksService.getTaskSummary(projectId);
    return {
      message: 'Tasks summary fetched successfully',
      data: summary,
    };
  }

  @Get(':id/assignee')
  async updateAssigne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() assigneeId: string,
  ) {
    const task = await this.tasksService.updateAssigne(
      projectId,
      id,
      assigneeId,
    );
    return {
      message: 'Task assigned successfully',
      data: task,
    };
  }
}
