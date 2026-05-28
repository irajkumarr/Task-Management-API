import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';
import { WorkspaceRole } from '../workspace-members/entities/workspace-member.entity';
import { slugify } from 'src/common/utils/slug.util';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // const slug = slugify(createWorkspaceDto.name);
      const slug = await this.generateUniqueSlug(createWorkspaceDto.name);

      // Create workspace
      const workspace = queryRunner.manager.create(Workspace, {
        ...createWorkspaceDto,
        slug,
        ownerId: userId,
      });

      const savedWorkspace = await queryRunner.manager.save(workspace);
      // Create owner membership
      await this.workspaceMembersService.create(
        {
          workspaceId: savedWorkspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return savedWorkspace;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        throw new ConflictException('Workspace slug already exists');
      }

      throw new InternalServerErrorException(
        error.message || 'Failed to create workspace',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string) {
    return await this.workspaceRepository
      .createQueryBuilder('workspace')

      .innerJoin('workspace.members', 'member', 'member.userId = :userId', {
        userId,
      })

      .leftJoinAndSelect('workspace.owner', 'owner')

      .select([
        'workspace.id',
        'workspace.name',
        'workspace.slug',
        'workspace.description',
        'workspace.createdAt',

        'owner.id',
        'owner.fullName',
        'owner.email',
      ])

      .orderBy('workspace.createdAt', 'DESC')

      .getMany();
  }

  async findOne(userId: string, id: string) {
    return await this.workspaceRepository
      .createQueryBuilder('workspace')

      // ensure user is part of workspace
      .innerJoin('workspace.members', 'member', 'member.userId = :userId', {
        userId,
      })

      // workspace filter
      .where('workspace.id = :id', { id })

      // owner relation
      .leftJoinAndSelect('workspace.owner', 'owner')

      // members + user inside members
      .leftJoinAndSelect('workspace.members', 'members')
      .leftJoinAndSelect('members.user', 'user')

      // single select (IMPORTANT FIX)
      .select([
        // workspace
        'workspace.id',
        'workspace.name',
        'workspace.slug',
        'workspace.description',
        'workspace.createdAt',

        // owner
        'owner.id',
        'owner.fullName',
        'owner.email',

        // members
        'members.id',
        'members.role',
        'members.joinedAt',

        // member user
        'user.id',
        'user.fullName',
        'user.email',
      ])

      .getOne();
  }

  update(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    return `This action updates a #${id} workspace`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspace`;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name);
    // "acme-team"
    let slug = baseSlug;
    let counter = 1;
    // keep trying until we find a slug that doesn't exist
    while (true) {
      const existing = await this.workspaceRepository.findOne({
        where: { slug },
      });
      if (!existing) break;
      // slug is free, use it
      slug = `${baseSlug}-${counter}`; // try "acme-team-1", "acme-team-2"…
      counter++;
    }
    return slug;
  }
}
