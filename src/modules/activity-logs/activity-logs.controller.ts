import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { FilterActivityLogsDto } from './dto/filter-activity-logs.dto';
import { WorkspaceMemberGuard } from 'src/common/guards/workspace-member.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/activity-logs')
@UseGuards(WorkspaceMemberGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filterDto: FilterActivityLogsDto,
  ) {
    const response = await this.activityLogsService.findAll(
      workspaceId,
      filterDto,
    );
    return {
      message: 'Activity logs fetched successfully',
      data: response.logs,
      meta: response.meta,
    };
  }
}
