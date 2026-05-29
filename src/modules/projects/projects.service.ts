import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from 'src/common/utils/slug.util';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
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

    return await this.projectsRepository.save(project);
  }

 async findAll(workspaceId:string) {
    const projects=await this.projectsRepository.find({
      where:{workspaceId}
    })
    return projects;
  }

  findOne(id: string) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
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
      });
      if (!existing) break;
      // slug is free, use it
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
