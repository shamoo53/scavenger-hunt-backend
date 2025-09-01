export enum AnnouncementType {
  EVENT = 'event',
  COMPETITION = 'competition',
  MAINTENANCE = 'maintenance',
  UPDATE = 'update',
  GENERAL = 'general',
  PROMOTION = 'promotion',
  COMMUNITY = 'community',
  PARTNERSHIP = 'partnership',
  ACHIEVEMENT = 'achievement',
  NOTICE = 'notice',
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
}
