import { Injectable, NotFoundException } from '@nestjs/common';
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

  findAll() {
    return `This action returns all workspaceMembers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workspaceMember`;
  }

  update(id: number, updateWorkspaceMemberDto: UpdateWorkspaceMemberDto) {
    return `This action updates a #${id} workspaceMember`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspaceMember`;
  }
}
