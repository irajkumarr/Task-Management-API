import { Injectable } from '@nestjs/common';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { QueryRunner, Repository } from 'typeorm';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
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
