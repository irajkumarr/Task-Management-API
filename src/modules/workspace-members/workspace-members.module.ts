import { Module } from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMember]),UsersModule],
  controllers: [WorkspaceMembersController],
  providers: [WorkspaceMembersService],
  exports: [WorkspaceMembersService,TypeOrmModule],
})
export class WorkspaceMembersModule {}
