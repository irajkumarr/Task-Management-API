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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '../workspace-members/entities/workspace-member.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @CurrentUser('id') id: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.create(
      id,
      createWorkspaceDto,
    );
    return {
      message: 'Workspace created successfully',
      data: workspace,
    };
  }

  @Get()
  async findAll(@CurrentUser('id') id: string) {
    const workspaces = await this.workspacesService.findAll(id);
    return {
      message: 'Workspaces fetched successfully',
      data: workspaces,
    };
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const workspace = await this.workspacesService.findOne(userId, id);
    return {
      message: 'Workspace fetched successfully',
      data: workspace,
    };
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const updatedWorkspace = await this.workspacesService.update(
      id,
      updateWorkspaceDto,
    );
    return {
      message: 'Workspace updated successfully',
      data: updatedWorkspace,
    };
  }

  @Delete(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER)
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(id);
  }
}
