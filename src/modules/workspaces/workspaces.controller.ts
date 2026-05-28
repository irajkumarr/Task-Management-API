import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const workspace = await this.workspacesService.findOne(userId, id);
    return {
      message: 'Workspace fetched successfully',
      data: workspace,
    };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(+id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(+id);
  }
}
