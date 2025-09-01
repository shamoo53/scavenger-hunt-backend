import { Injectable, Logger } from '@nestjs/common';
import { EventAnnouncement } from '../entities/event-announcement.entity';

export interface NotificationPayload {
  type:
    | 'new_announcement'
    | 'updated_announcement'
    | 'featured_announcement'
    | 'urgent_announcement';
  announcement: EventAnnouncement;
  targetAudience?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface UserSubscription {
  userId: string;
  categories: string[];
  types: string[];
  preferences: {
    realTime: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  lastActivity: Date;
}

@Injectable()
export class AnnouncementNotificationService {
  private readonly logger = new Logger(AnnouncementNotificationService.name);

  // In-memory storage for subscriptions (in production, use database)
  private userSubscriptions = new Map<string, UserSubscription>();

  // WebSocket connections storage (will be injected by gateway)
  private socketConnections = new Map<string, any>();

  /**
   * Subscribe user to announcement notifications
   */
  async subscribeUser(
    userId: string,
    subscription: Partial<UserSubscription>,
  ): Promise<void> {
    try {
      const existingSubscription = this.userSubscriptions.get(userId);

      const updatedSubscription: UserSubscription = {
        userId,
        categories: subscription.categories || ['general'],
        types: subscription.types || ['GENERAL'],
        preferences: {
          realTime: true,
          email: false,
          push: false,
          sms: false,
          ...subscription.preferences,
        },
        lastActivity: new Date(),
        ...existingSubscription,
      };

      this.userSubscriptions.set(userId, updatedSubscription);
      this.logger.debug(`User ${userId} subscribed to announcements`);
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unsubscribe user from notifications
   */
  async unsubscribeUser(userId: string): Promise<void> {
    try {
      this.userSubscriptions.delete(userId);
      this.socketConnections.delete(userId);
      this.logger.debug(`User ${userId} unsubscribed from announcements`);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserSubscription['preferences']>,
  ): Promise<void> {
    try {
      const subscription = this.userSubscriptions.get(userId);
      if (subscription) {
        subscription.preferences = {
          ...subscription.preferences,
          ...preferences,
        };
        subscription.lastActivity = new Date();
        this.userSubscriptions.set(userId, subscription);
        this.logger.debug(`Updated preferences for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update preferences for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send notification for new or updated announcement
   */
  async notifyUsers(payload: NotificationPayload): Promise<void> {
    try {
      const targetUsers = this.getTargetUsers(payload);

      this.logger.debug(
        `Sending ${payload.type} notification to ${targetUsers.length} users`,
      );

      // Send real-time notifications
      await Promise.all([
        this.sendRealTimeNotifications(targetUsers, payload),
        this.sendEmailNotifications(targetUsers, payload),
        this.sendPushNotifications(targetUsers, payload),
      ]);

      this.logger.log(
        `Successfully sent notifications for announcement ${payload.announcement.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notify about urgent announcements
   */
  async notifyUrgentAnnouncement(
    announcement: EventAnnouncement,
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        type: 'urgent_announcement',
        announcement,
        priority: 'urgent',
        targetAudience: announcement.targetAudience || ['all'],
      };

      await this.notifyUsers(payload);
      this.logger.log(
        `Sent urgent notification for announcement ${announcement.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send urgent notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notify about featured announcements
   */
  async notifyFeaturedAnnouncement(
    announcement: EventAnnouncement,
  ): Promise<void> {
    try {
      if (!announcement.isFeatured) return;

      const payload: NotificationPayload = {
        type: 'featured_announcement',
        announcement,
        priority: 'high',
        targetAudience: announcement.targetAudience || ['all'],
      };

      await this.notifyUsers(payload);
      this.logger.log(
        `Sent featured notification for announcement ${announcement.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send featured notification: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Register WebSocket connection for real-time notifications
   */
  registerSocketConnection(userId: string, socket: any): void {
    try {
      this.socketConnections.set(userId, socket);
      this.updateUserActivity(userId);
      this.logger.debug(`Registered WebSocket connection for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to register socket for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Remove WebSocket connection
   */
  removeSocketConnection(userId: string): void {
    try {
      this.socketConnections.delete(userId);
      this.logger.debug(`Removed WebSocket connection for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove socket for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Get user subscription info
   */
  getUserSubscription(userId: string): UserSubscription | null {
    return this.userSubscriptions.get(userId) || null;
  }

  /**
   * Get all active subscribers
   */
  getActiveSubscribers(): UserSubscription[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Consider active if activity within 24 hours

    return Array.from(this.userSubscriptions.values()).filter(
      (subscription) => subscription.lastActivity > cutoffTime,
    );
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): Record<string, any> {
    const totalSubscribers = this.userSubscriptions.size;
    const activeConnections = this.socketConnections.size;
    const subscriptionsWithEmail = Array.from(
      this.userSubscriptions.values(),
    ).filter((s) => s.preferences.email).length;
    const subscriptionsWithPush = Array.from(
      this.userSubscriptions.values(),
    ).filter((s) => s.preferences.push).length;

    return {
      totalSubscribers,
      activeConnections,
      subscriptionsWithEmail,
      subscriptionsWithPush,
      connectionRate:
        totalSubscribers > 0 ? (activeConnections / totalSubscribers) * 100 : 0,
    };
  }

  // Private helper methods

  private getTargetUsers(payload: NotificationPayload): UserSubscription[] {
    const { announcement, targetAudience } = payload;

    return Array.from(this.userSubscriptions.values()).filter(
      (subscription) => {
        // Check if user is interested in this type
        if (!subscription.types.includes(announcement.type)) {
          return false;
        }

        // Check if user is interested in this category
        if (
          announcement.category &&
          subscription.categories.length > 0 &&
          !subscription.categories.includes(announcement.category)
        ) {
          return false;
        }

        // Check target audience
        if (targetAudience && targetAudience.length > 0) {
          if (
            !targetAudience.includes('all') &&
            !targetAudience.some((audience) =>
              this.userMatchesAudience(subscription.userId, audience),
            )
          ) {
            return false;
          }
        }

        return true;
      },
    );
  }

  private async sendRealTimeNotifications(
    users: UserSubscription[],
    payload: NotificationPayload,
  ): Promise<void> {
    const realTimeUsers = users.filter((user) => user.preferences.realTime);

    for (const user of realTimeUsers) {
      const socket = this.socketConnections.get(user.userId);
      if (socket && socket.connected) {
        try {
          socket.emit('announcement_notification', {
            type: payload.type,
            announcement: this.formatAnnouncementForNotification(
              payload.announcement,
            ),
            priority: payload.priority,
            timestamp: new Date(),
          });
        } catch (error) {
          this.logger.warn(
            `Failed to send real-time notification to user ${user.userId}: ${error.message}`,
          );
        }
      }
    }

    this.logger.debug(
      `Sent real-time notifications to ${realTimeUsers.length} users`,
    );
  }

  private async sendEmailNotifications(
    users: UserSubscription[],
    payload: NotificationPayload,
  ): Promise<void> {
    const emailUsers = users.filter((user) => user.preferences.email);

    // In a real implementation, you would integrate with an email service
    this.logger.debug(
      `Would send email notifications to ${emailUsers.length} users`,
    );

    // Mock email sending
    for (const user of emailUsers) {
      // await this.emailService.sendAnnouncementNotification(user.userId, payload);
    }
  }

  private async sendPushNotifications(
    users: UserSubscription[],
    payload: NotificationPayload,
  ): Promise<void> {
    const pushUsers = users.filter((user) => user.preferences.push);

    // In a real implementation, you would integrate with a push notification service
    this.logger.debug(
      `Would send push notifications to ${pushUsers.length} users`,
    );

    // Mock push notification sending
    for (const user of pushUsers) {
      // await this.pushService.sendAnnouncementNotification(user.userId, payload);
    }
  }

  private userMatchesAudience(userId: string, audience: string): boolean {
    // Mock implementation - in a real app, you'd have user profile data
    switch (audience) {
      case 'all':
        return true;
      case 'new-users':
        // Check if user is new (registered within last 30 days)
        return Math.random() > 0.7;
      case 'premium-users':
        // Check if user has premium subscription
        return Math.random() > 0.8;
      case 'developers':
        // Check if user is a developer
        return Math.random() > 0.9;
      default:
        return false;
    }
  }

  private formatAnnouncementForNotification(
    announcement: EventAnnouncement,
  ): Record<string, any> {
    return {
      id: announcement.id,
      title: announcement.title,
      summary:
        announcement.summary || announcement.content.substring(0, 200) + '...',
      type: announcement.type,
      priority: announcement.priority,
      publishedAt: announcement.publishedAt,
      imageUrl: announcement.imageUrl,
      eventDate: announcement.eventDate,
    };
  }

  private updateUserActivity(userId: string): void {
    const subscription = this.userSubscriptions.get(userId);
    if (subscription) {
      subscription.lastActivity = new Date();
      this.userSubscriptions.set(userId, subscription);
    }
  }
}
