import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { TaskSchedulerService } from './task-scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Notification, User]),
    NotificationsModule,
    MailModule,
    UsersModule,
  ],
  controllers: [SchedulerController],
  providers: [TaskSchedulerService],
  exports: [TaskSchedulerService],
})
export class SchedulerModule {}
