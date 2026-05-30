import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), WorkspaceMembersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
