import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncementsController } from './event-announcements.controller';
import { AnnouncementTemplatesController } from './controllers/templates.controller';
import { AnnouncementAnalyticsController } from './controllers/analytics.controller';
import { EventAnnouncement } from './entities/event-announcement.entity';
import { AnnouncementTemplate } from './entities/announcement-template.entity';
import { AnnouncementCacheService } from './services/cache.service';
import { AnnouncementAnalyticsService } from './services/analytics.service';
import { AnnouncementNotificationService } from './services/notification.service';
import { AnnouncementTemplateService } from './services/template.service';
import { AnnouncementsGateway } from './gateways/announcements.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventAnnouncement, AnnouncementTemplate]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    EventAnnouncementsController,
    AnnouncementTemplatesController,
    AnnouncementAnalyticsController,
  ],
  providers: [
    EventAnnouncementsService,
    AnnouncementCacheService,
    AnnouncementAnalyticsService,
    AnnouncementNotificationService,
    AnnouncementTemplateService,
    AnnouncementsGateway,
  ],
  exports: [
    EventAnnouncementsService,
    AnnouncementCacheService,
    AnnouncementAnalyticsService,
    AnnouncementNotificationService,
    AnnouncementTemplateService,
    TypeOrmModule,
  ],
})
export class EventAnnouncementsModule {}
