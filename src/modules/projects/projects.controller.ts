import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/projects')
@UseGuards(WorkspaceMemberGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectsService.create(
      workspaceId,
      userId,
      createProjectDto,
    );
    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  @Get()
  async findAll(@Param('workspaceId') workspaceId: string) {
    const projects = await this.projectsService.findAll(workspaceId);
    return {
      message: 'Projects fetched successfully',
      data: projects,
    };
  }

  @Get(':id')
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    const project = await this.projectsService.findOne(workspaceId, id);
    return {
      message: 'Project fetched successfully',
      data: project,
    };
  }

  @Patch(':id')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const updatedProject = await this.projectsService.update(
      workspaceId,
      id,
      updateProjectDto,
    );
    return {
      message: 'Project updated successfully',
      data: updatedProject,
    };
  }

  @Delete(':id')
  remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.projectsService.remove(workspaceId, id);
  }
}
