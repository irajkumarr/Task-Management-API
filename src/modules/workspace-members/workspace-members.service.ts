import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { QueryRunner, Repository } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceRole,
} from './entities/workspace-member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from '../users/users.service';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,

    private readonly usersService: UsersService,
  ) {}

  async create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
    queryRunner?: QueryRunner,
  ) {
    const workspaceMember = this.workspaceMemberRepository.create(
      createWorkspaceMemberDto,
    );

    if (queryRunner) {
      return await queryRunner.manager.save(workspaceMember);
    }

    return await this.workspaceMemberRepository.save(workspaceMember);
  }

  async inviteMember(workspaceId: string, inviteMemberDto: InviteMemberDto) {
    const user = await this.usersService.findByEmail(inviteMemberDto.email);
    if (!user) {
      throw new NotFoundException(
        `No user found with email ${inviteMemberDto.email}`,
      );
    }
    const workspaceMember = this.create({
      workspaceId,
      userId: user.id,
      role: inviteMemberDto.role ?? WorkspaceRole.MEMBER,
    });

    return workspaceMember;
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    currentMember: WorkspaceMember,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const targetMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: targetUserId,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }
    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Owner role cannot be changed');
    }

    if (updateMemberRoleDto.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Ownership role cannot be updated');
    }

    if (
      targetMember.role === WorkspaceRole.ADMIN &&
      currentMember.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException('Only owner can change admin role');
    }

    if (
      updateMemberRoleDto.role === WorkspaceRole.ADMIN &&
      currentMember.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException('Only owner can assign admin role');
    }

    if (
      ![WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(currentMember.role)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    targetMember.role = updateMemberRoleDto.role;

    return await this.workspaceMemberRepository.save(targetMember);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    currentMember: WorkspaceMember,
  ) {
    const targetMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: targetUserId,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        "You can't remove the OWNER of the workspace.",
      );
    }

    if (
      targetMember.role === WorkspaceRole.ADMIN &&
      currentMember.role === WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Admins cannot remove other admins. Only the owner can remove an admin.',
      );
    }

    return await this.workspaceMemberRepository.remove(targetMember);
  }


}
