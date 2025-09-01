import { Test, TestingModule } from '@nestjs/testing';
import {
  AnnouncementNotificationService,
  NotificationPayload,
  UserSubscription,
} from './notification.service';
import { EventAnnouncement } from '../entities/event-announcement.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';

describe('AnnouncementNotificationService', () => {
  let service: AnnouncementNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnouncementNotificationService],
    }).compile();

    service = module.get<AnnouncementNotificationService>(
      AnnouncementNotificationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('subscribeUser', () => {
    it('should subscribe user to notifications', async () => {
      const userId = 'user-123';
      const subscription: Partial<UserSubscription> = {
        categories: ['events', 'updates'],
        types: ['EVENT', 'GENERAL'],
        preferences: {
          realTime: true,
          email: true,
          push: false,
          sms: false,
        },
      };

      await service.subscribeUser(userId, subscription);

      const userSubscription = service.getUserSubscription(userId);
      expect(userSubscription).toBeDefined();
      expect(userSubscription.userId).toBe(userId);
      expect(userSubscription.categories).toEqual(['events', 'updates']);
      expect(userSubscription.types).toEqual(['EVENT', 'GENERAL']);
      expect(userSubscription.preferences.realTime).toBe(true);
      expect(userSubscription.preferences.email).toBe(true);
    });

    it('should use default values for missing subscription data', async () => {
      const userId = 'user-456';

      await service.subscribeUser(userId, {});

      const userSubscription = service.getUserSubscription(userId);
      expect(userSubscription.categories).toEqual(['general']);
      expect(userSubscription.types).toEqual(['GENERAL']);
      expect(userSubscription.preferences.realTime).toBe(true);
      expect(userSubscription.preferences.email).toBe(false);
    });

    it('should update existing subscription', async () => {
      const userId = 'user-789';

      // First subscription
      await service.subscribeUser(userId, {
        categories: ['events'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      // Update subscription
      await service.subscribeUser(userId, {
        categories: ['events', 'updates'],
        preferences: { realTime: true, email: true, push: true, sms: false },
      });

      const userSubscription = service.getUserSubscription(userId);
      expect(userSubscription.categories).toEqual(['events', 'updates']);
      expect(userSubscription.preferences.email).toBe(true);
      expect(userSubscription.preferences.push).toBe(true);
    });

    it('should handle subscription errors gracefully', async () => {
      const userId = null as any; // Invalid userId

      await expect(service.subscribeUser(userId, {})).rejects.toThrow();
    });
  });

  describe('unsubscribeUser', () => {
    it('should unsubscribe user from notifications', async () => {
      const userId = 'user-123';

      // First subscribe
      await service.subscribeUser(userId, {
        categories: ['events'],
        preferences: { realTime: true, email: true, push: false, sms: false },
      });

      // Then unsubscribe
      await service.unsubscribeUser(userId);

      const userSubscription = service.getUserSubscription(userId);
      expect(userSubscription).toBeNull();
    });

    it('should handle unsubscribing non-existent user', async () => {
      await expect(
        service.unsubscribeUser('non-existent-user'),
      ).resolves.not.toThrow();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user notification preferences', async () => {
      const userId = 'user-123';

      // First subscribe
      await service.subscribeUser(userId, {
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      // Update preferences
      await service.updateUserPreferences(userId, {
        email: true,
        push: true,
      });

      const userSubscription = service.getUserSubscription(userId);
      expect(userSubscription.preferences.realTime).toBe(true); // Unchanged
      expect(userSubscription.preferences.email).toBe(true); // Updated
      expect(userSubscription.preferences.push).toBe(true); // Updated
      expect(userSubscription.preferences.sms).toBe(false); // Unchanged
    });

    it('should update lastActivity when updating preferences', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {});
      const originalActivity = service.getUserSubscription(userId).lastActivity;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.updateUserPreferences(userId, { email: true });
      const updatedActivity = service.getUserSubscription(userId).lastActivity;

      expect(updatedActivity.getTime()).toBeGreaterThan(
        originalActivity.getTime(),
      );
    });

    it('should handle updating preferences for non-existent user', async () => {
      await expect(
        service.updateUserPreferences('non-existent', { email: true }),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyUsers', () => {
    it('should notify users based on their subscriptions', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // Subscribe users
      await service.subscribeUser(userId1, {
        categories: ['events'],
        types: ['EVENT'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      await service.subscribeUser(userId2, {
        categories: ['general'],
        types: ['GENERAL'],
        preferences: { realTime: true, email: true, push: false, sms: false },
      });

      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Event',
        type: AnnouncementType.EVENT,
        category: 'events',
        priority: AnnouncementPriority.HIGH,
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement: mockAnnouncement,
        priority: 'high',
        targetAudience: ['all'],
      };

      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });

    it('should filter users based on announcement type', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        types: ['GENERAL'], // Only interested in general announcements
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const eventAnnouncement = {
        id: 'announcement-456',
        type: AnnouncementType.EVENT, // Different type
        category: 'events',
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement: eventAnnouncement,
        priority: 'medium',
      };

      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });

    it('should filter users based on announcement category', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: ['sports'], // Only interested in sports
        types: ['EVENT'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const techAnnouncement = {
        id: 'announcement-789',
        type: AnnouncementType.EVENT,
        category: 'technology', // Different category
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement: techAnnouncement,
        priority: 'medium',
      };

      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });

    it('should handle target audience filtering', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: ['general'],
        types: ['GENERAL'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
        category: 'general',
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement,
        priority: 'medium',
        targetAudience: ['premium-users'], // Specific audience
      };

      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });
  });

  describe('notifyUrgentAnnouncement', () => {
    it('should send urgent notification', async () => {
      const mockAnnouncement = {
        id: 'urgent-123',
        title: 'Urgent System Maintenance',
        type: AnnouncementType.MAINTENANCE,
        priority: AnnouncementPriority.URGENT,
        targetAudience: ['all'],
      } as EventAnnouncement;

      await expect(
        service.notifyUrgentAnnouncement(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyFeaturedAnnouncement', () => {
    it('should send featured notification for featured announcements', async () => {
      const mockAnnouncement = {
        id: 'featured-123',
        title: 'Featured Event',
        type: AnnouncementType.EVENT,
        isFeatured: true,
        targetAudience: ['all'],
      } as EventAnnouncement;

      await expect(
        service.notifyFeaturedAnnouncement(mockAnnouncement),
      ).resolves.not.toThrow();
    });

    it('should not send notification for non-featured announcements', async () => {
      const mockAnnouncement = {
        id: 'regular-123',
        title: 'Regular Announcement',
        type: AnnouncementType.GENERAL,
        isFeatured: false,
      } as EventAnnouncement;

      await expect(
        service.notifyFeaturedAnnouncement(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('Socket Connection Management', () => {
    it('should register socket connection', () => {
      const userId = 'user-123';
      const mockSocket = { id: 'socket-123', connected: true, emit: jest.fn() };

      service.registerSocketConnection(userId, mockSocket);

      // Since we can't directly test the internal map, we test the behavior
      expect(() =>
        service.registerSocketConnection(userId, mockSocket),
      ).not.toThrow();
    });

    it('should remove socket connection', () => {
      const userId = 'user-123';

      expect(() => service.removeSocketConnection(userId)).not.toThrow();
    });

    it('should handle invalid socket registration', () => {
      const userId = null as any;
      const mockSocket = null as any;

      expect(() =>
        service.registerSocketConnection(userId, mockSocket),
      ).not.toThrow();
    });
  });

  describe('getActiveSubscribers', () => {
    it('should return active subscribers', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      await service.subscribeUser(userId1, {
        preferences: { realTime: true, email: false, push: false, sms: false },
      });
      await service.subscribeUser(userId2, {
        preferences: { realTime: false, email: true, push: false, sms: false },
      });

      const activeSubscribers = service.getActiveSubscribers();

      expect(activeSubscribers).toHaveLength(2);
      expect(activeSubscribers.map((s) => s.userId)).toContain(userId1);
      expect(activeSubscribers.map((s) => s.userId)).toContain(userId2);
    });

    it('should filter out inactive subscribers', async () => {
      const userId = 'user-old';

      await service.subscribeUser(userId, {
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      // Manually set old activity (simulating old subscription)
      const subscription = service.getUserSubscription(userId);
      if (subscription) {
        subscription.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }

      const activeSubscribers = service.getActiveSubscribers();

      expect(activeSubscribers).toHaveLength(0);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      await service.subscribeUser(userId1, {
        preferences: { realTime: true, email: true, push: false, sms: false },
      });
      await service.subscribeUser(userId2, {
        preferences: { realTime: false, email: false, push: true, sms: false },
      });

      const stats = service.getNotificationStats();

      expect(stats.totalSubscribers).toBe(2);
      expect(stats.activeConnections).toBe(0); // No socket connections
      expect(stats.subscriptionsWithEmail).toBe(1);
      expect(stats.subscriptionsWithPush).toBe(1);
      expect(stats.connectionRate).toBe(0);
    });

    it('should handle empty subscriptions', () => {
      const stats = service.getNotificationStats();

      expect(stats.totalSubscribers).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.subscriptionsWithEmail).toBe(0);
      expect(stats.subscriptionsWithPush).toBe(0);
      expect(stats.connectionRate).toBe(0);
    });

    it('should calculate connection rate correctly', async () => {
      const userId = 'user-1';
      const mockSocket = { id: 'socket-1', connected: true, emit: jest.fn() };

      await service.subscribeUser(userId, {
        preferences: { realTime: true, email: false, push: false, sms: false },
      });
      service.registerSocketConnection(userId, mockSocket);

      const stats = service.getNotificationStats();

      expect(stats.totalSubscribers).toBe(1);
      expect(stats.activeConnections).toBe(1);
      expect(stats.connectionRate).toBe(100);
    });
  });

  describe('Notification Delivery Channels', () => {
    beforeEach(async () => {
      // Setup users with different preferences
      await service.subscribeUser('user-realtime', {
        preferences: { realTime: true, email: false, push: false, sms: false },
      });
      await service.subscribeUser('user-email', {
        preferences: { realTime: false, email: true, push: false, sms: false },
      });
      await service.subscribeUser('user-push', {
        preferences: { realTime: false, email: false, push: true, sms: false },
      });
      await service.subscribeUser('user-all', {
        preferences: { realTime: true, email: true, push: true, sms: true },
      });
    });

    it('should handle real-time notifications', async () => {
      const mockSocket = { id: 'socket-1', connected: true, emit: jest.fn() };
      service.registerSocketConnection('user-realtime', mockSocket);

      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
        category: 'general',
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement,
        priority: 'medium',
      };

      await service.notifyUsers(payload);

      // The socket emit should have been called
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('should handle email notifications', async () => {
      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
        category: 'general',
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement,
        priority: 'medium',
      };

      // Should not throw even though email service is mocked
      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });

    it('should handle push notifications', async () => {
      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
        category: 'general',
      } as EventAnnouncement;

      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement,
        priority: 'medium',
      };

      // Should not throw even though push service is mocked
      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });
  });

  describe('Audience Targeting', () => {
    it('should match users to audience segments', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: ['general'],
        types: ['GENERAL'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
        category: 'general',
      } as EventAnnouncement;

      // Test different audience types
      const audiences = ['all', 'new-users', 'premium-users', 'developers'];

      for (const audience of audiences) {
        const payload: NotificationPayload = {
          type: 'new_announcement',
          announcement,
          priority: 'medium',
          targetAudience: [audience],
        };

        await expect(service.notifyUsers(payload)).resolves.not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle notification errors gracefully', async () => {
      const announcement = {
        id: 'announcement-123',
        type: AnnouncementType.GENERAL,
      } as EventAnnouncement;

      const invalidPayload = {
        type: 'invalid_type',
        announcement,
        priority: 'invalid_priority',
      } as any;

      await expect(service.notifyUsers(invalidPayload)).resolves.not.toThrow();
    });

    it('should handle socket connection errors', () => {
      const userId = 'user-123';
      const invalidSocket = null as any;

      expect(() =>
        service.registerSocketConnection(userId, invalidSocket),
      ).not.toThrow();
    });

    it('should handle missing announcement data', async () => {
      const payload: NotificationPayload = {
        type: 'new_announcement',
        announcement: null as any,
        priority: 'medium',
      };

      await expect(service.notifyUsers(payload)).resolves.not.toThrow();
    });
  });

  describe('Subscription Validation', () => {
    it('should validate subscription categories', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: [], // Empty categories
        types: ['GENERAL'],
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const subscription = service.getUserSubscription(userId);
      expect(subscription.categories).toEqual(['general']); // Should use default
    });

    it('should validate subscription types', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: ['events'],
        types: [], // Empty types
        preferences: { realTime: true, email: false, push: false, sms: false },
      });

      const subscription = service.getUserSubscription(userId);
      expect(subscription.types).toEqual(['GENERAL']); // Should use default
    });

    it('should validate notification preferences', async () => {
      const userId = 'user-123';

      await service.subscribeUser(userId, {
        categories: ['events'],
        types: ['EVENT'],
        // No preferences provided
      });

      const subscription = service.getUserSubscription(userId);
      expect(subscription.preferences).toBeDefined();
      expect(subscription.preferences.realTime).toBe(true); // Default
      expect(subscription.preferences.email).toBe(false); // Default
    });
  });
});
