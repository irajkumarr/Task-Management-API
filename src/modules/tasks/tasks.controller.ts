import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { ProjectExistsGuard } from 'src/common/guards/project-exists.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { TaskOwnershipGuard } from 'src/common/guards/task-ownership.guard';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from 'src/modules/workspace-members/entities/workspace-member.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AssignTaskDto,
  MoveTaskDto,
  UpdateTaskStatusDto,
} from './dto/task-operations.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
// 1. Controller-level guards check workspace membership, roles & project existence
@UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard, ProjectExistsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // 2. Only Owners, Admins, and Members can CREATE tasks (Viewers blocked)
  @Post()
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
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
    return { message: 'Task created successfully', data: task };
  }

  // 3. Viewers, Members, Admins, Owners can all view tasks
  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() filterTaskDto: FilterTaskDto,
  ) {
    const response = await this.tasksService.findAll(projectId, filterTaskDto);
    return {
      message: 'Tasks fetched successfully',
      data: response.tasks,
      meta: response.meta,
    };
  }

  @Get(':id')
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const task = await this.tasksService.findOne(projectId, id);
    return { message: 'Task fetched successfully', data: task };
  }

  // 4. Task Ownership Guard: Admin/Owner can update any task; Member can only update their own
  @Patch(':id')
  @UseGuards(TaskOwnershipGuard)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(projectId, id, updateTaskDto);
    return { message: 'Task updated successfully', data: task };
  }

  // 5. Task Ownership Guard for Deletion
  @Delete(':id')
  @UseGuards(TaskOwnershipGuard)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return await this.tasksService.remove(projectId, id);
  }

  @Patch(':id/status')
  @UseGuards(TaskOwnershipGuard)
  async updateStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() data: UpdateTaskStatusDto,
  ) {
    const task = await this.tasksService.updateStatus(
      projectId,
      id,
      data.status,
    );
    return { message: 'Task status updated successfully', data: task };
  }

  @Patch(':id/move')
  @UseGuards(TaskOwnershipGuard)
  async updatePosition(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() data: MoveTaskDto,
  ) {
    const task = await this.tasksService.updatePosition(projectId, id, data);
    return { message: 'Task position updated successfully', data: task };
  }

  @Get('board/all')
  async getTaskBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    const tasks = await this.tasksService.getTaskBoard(projectId);
    return { message: 'Tasks board fetched successfully', data: tasks };
  }

  @Get('summary/all')
  async getTaskSummary(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    const summary = await this.tasksService.getTaskSummary(projectId);
    return { message: 'Tasks summary fetched successfully', data: summary };
  }

  // 6. Assign / Unassign: Only Owner, Admin, or Creator can change assignee
  @Patch(':id/assignee')
  @UseGuards(TaskOwnershipGuard)
  async updateAssigne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() data: AssignTaskDto,
  ) {
    const task = await this.tasksService.updateAssigne(
      workspaceId,
      projectId,
      id,
      data.assigneeId,
    );
    return { message: 'Task assigned successfully', data: task };
  }
}
