import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, WorkspaceMember])],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, WorkspaceMemberGuard],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
