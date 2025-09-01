import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncementsController } from './event-announcements.controller';
import { EventAnnouncement } from './entities/event-announcement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventAnnouncement]),
    ScheduleModule.forRoot(),
  ],
  controllers: [EventAnnouncementsController],
  providers: [EventAnnouncementsService],
  exports: [EventAnnouncementsService, TypeOrmModule],
})
export class EventAnnouncementsModule {}
