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
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from './entities/workspace-member.entity';

@Controller('workspace-members')
export class WorkspaceMembersController {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  create(@Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto) {
    return this.workspaceMembersService.create(createWorkspaceMemberDto);
  }

  @Post(':id/members')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async inviteMember(
    @Param('id') workspaceId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    const invitedMember = await this.workspaceMembersService.inviteMember(
      workspaceId,
      inviteMemberDto,
    );

    return {
      message: 'Member invited successfully',
      data: invitedMember,
    };
  }

  @Get()
  findAll() {
    return this.workspaceMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceMembersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceMemberDto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaceMembersService.update(+id, updateWorkspaceMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceMembersService.remove(+id);
  }
}
