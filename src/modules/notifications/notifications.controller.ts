import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filterNotificationsDto: FilterNotificationsDto,
  ) {
    const response = await this.notificationsService.findAll(
      userId,
      filterNotificationsDto,
    );
    return {
      message: 'Notifications fetched successfully',
      data: response.notifications,
      meta: response.meta,
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.unreadCount(userId);
    return {
      message: 'Unread Notifications count fetched successfully',
      data: { unreadCount: count },
    };
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.notificationsService.markAsRead(userId, id);
    return {
      message: 'Notification marked successfully',
    };
  }
  @Patch('mark-all-read')
  async markAllRead(@CurrentUser('id') userId: string) {
    return await this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return await this.notificationsService.remove(userId, id);
  }
}
