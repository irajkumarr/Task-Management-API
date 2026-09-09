import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { slugify } from 'src/common/utils/slug.util';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/constants/events.constant';
import {
  ProjectCreatedEvent,
  ProjectDeletedEvent,
  ProjectUpdatedEvent,
} from 'src/common/events/app-events';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    userName: string,
    createProjectDto: CreateProjectDto,
  ) {
    const slug = await this.generateUniqueSlug(
      workspaceId,
      createProjectDto.name,
    );

    const project = this.projectsRepository.create({
      ...createProjectDto,
      slug,
      workspaceId,
      createdById: userId,
    });

    const savedProject = await this.projectsRepository.save(project);

    this.eventEmitter.emit(
      AppEvents.PROJECT_CREATED,
      new ProjectCreatedEvent(
        savedProject.id,
        savedProject.name,
        workspaceId,
        userId,
        userName,
      ),
    );

    return savedProject;
  }

  async findAll(workspaceId: string) {
    const projects = await this.projectsRepository.find({
      where: { workspaceId, status: Not('archived') },
    });
    return projects;
  }

  async findOne(workspaceId: string, id: string) {
    const project = await this.projectsRepository.findOne({
      where: { workspaceId, id },
      relations: {
        user: true,
        workspace: true,
      },
      select: {
        user: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  async update(
    workspaceId: string,
    id: string,
    userId: string,
    userName: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id, workspaceId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    await this.projectsRepository.update(id, updateProjectDto);
    const updatedProject = await this.findOne(workspaceId, id);

    this.eventEmitter.emit(
      AppEvents.PROJECT_UPDATED,
      new ProjectUpdatedEvent(
        updatedProject.id,
        updatedProject.name,
        workspaceId,
        userId,
        userName,
      ),
    );

    return updatedProject;
  }

  async remove(
    workspaceId: string,
    id: string,
    userId: string,
    userName: string,
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id, workspaceId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    await this.projectsRepository.softRemove(project);

    this.eventEmitter.emit(
      AppEvents.PROJECT_DELETED,
      new ProjectDeletedEvent(
        project.id,
        project.name,
        workspaceId,
        userId,
        userName,
      ),
    );

    return { message: 'Project deleted successfully' };
  }

  private async generateUniqueSlug(
    workspaceId: string,
    name: string,
  ): Promise<string> {
    const baseSlug = slugify(name);

    let slug = baseSlug;
    let counter = 1;
    // keep trying until we find a slug that doesn't exist
    while (true) {
      const existing = await this.projectsRepository.findOne({
        where: { workspaceId, slug },
        withDeleted: true,
      });
      if (!existing) break;
      // slug is free, use it
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
