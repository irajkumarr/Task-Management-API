import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { WorkspaceRolesGuard } from 'src/common/guards/workspace-roles.guard';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from './entities/workspace-member.entity';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Workspace Members')
@ApiBearerAuth()
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
    @CurrentUser() user: { id: string; fullName: string },
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    const invitedMember = await this.workspaceMembersService.inviteMember(
      workspaceId,
      inviteMemberDto,
      user.id,
      user.fullName || 'An Admin',
    );

    return {
      message: 'Member invited successfully',
      data: invitedMember,
    };
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateMemberRole(
    @Req() req: any,
    @CurrentUser() user: { id: string; fullName: string },
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const member = await this.workspaceMembersService.updateMemberRole(
      workspaceId,
      targetUserId,
      req.workspaceMember,
      updateMemberRoleDto,
      user?.fullName || 'An Admin',
    );

    return {
      message: 'Member role updated successfully',
      data: member,
    };
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async removeMember(
    @Req() req: any,
    @CurrentUser() user: { id: string; fullName: string },
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.workspaceMembersService.removeMember(
      workspaceId,
      targetUserId,
      req.workspaceMember,
      user?.fullName || 'An Admin',
    );
    return {
      message: 'Member removed successfully',
    };
  }
}
