import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsGateway } from './announcements.gateway';
import { AnnouncementNotificationService } from '../services/notification.service';
import { EventAnnouncementsService } from '../event-announcements.service';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';

describe('AnnouncementsGateway', () => {
  let gateway: AnnouncementsGateway;
  let notificationService: AnnouncementNotificationService;
  let announcementsService: EventAnnouncementsService;

  const mockNotificationService = {
    notifyUsers: jest.fn(),
    notifyUrgentAnnouncement: jest.fn(),
    notifyFeaturedAnnouncement: jest.fn(),
    getNotificationStats: jest.fn(),
  };

  const mockAnnouncementsService = {
    findPublished: jest.fn(),
    getAnnouncementStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsGateway,
        {
          provide: AnnouncementNotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: EventAnnouncementsService,
          useValue: mockAnnouncementsService,
        },
      ],
    }).compile();

    gateway = module.get<AnnouncementsGateway>(AnnouncementsGateway);
    notificationService = module.get<AnnouncementNotificationService>(
      AnnouncementNotificationService,
    );
    announcementsService = module.get<EventAnnouncementsService>(
      EventAnnouncementsService,
    );

    // Reset all mocks
    Object.values(mockNotificationService).forEach((mock) => mock.mockClear());
    Object.values(mockAnnouncementsService).forEach((mock) => mock.mockClear());
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('Initialization', () => {
    it('should initialize in HTTP mode', () => {
      expect(gateway.isWebSocketEnabled()).toBe(false);
    });

    it('should provide setup instructions', () => {
      const instructions = gateway.getWebSocketSetupInstructions();

      expect(instructions).toHaveProperty('step1');
      expect(instructions.step1).toContain('npm install');
      expect(instructions).toHaveProperty('currentMode', 'http');
      expect(instructions).toHaveProperty('targetMode', 'websocket');
      expect(instructions).toHaveProperty('benefits');
      expect(Array.isArray(instructions.benefits)).toBe(true);
    });

    it('should list supported features', () => {
      const features = gateway.getSupportedFeatures();

      expect(features).toContain('http_notifications');
      expect(features).toContain('user_subscriptions');
      expect(features).toContain('notification_preferences');
      expect(features).toContain('urgent_notifications');
      expect(features).toContain('featured_notifications');
    });

    it('should list missing features', () => {
      const missingFeatures = gateway.getMissingFeatures();

      expect(missingFeatures).toContain('real_time_messaging');
      expect(missingFeatures).toContain('live_connection_tracking');
      expect(missingFeatures).toContain('instant_notifications');
      expect(missingFeatures).toContain('room_management');
      expect(missingFeatures).toContain('live_engagement_tracking');
    });
  });

  describe('broadcastNewAnnouncement', () => {
    it('should broadcast new announcement via notification service', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'New Event',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        targetAudience: ['all'],
        content: 'Event content',
      };

      mockNotificationService.notifyUsers.mockResolvedValue(undefined);

      await gateway.broadcastNewAnnouncement(mockAnnouncement);

      expect(mockNotificationService.notifyUsers).toHaveBeenCalledWith({
        type: 'new_announcement',
        announcement: mockAnnouncement,
        priority: 'high', // Mapped from AnnouncementPriority.HIGH
        targetAudience: ['all'],
      });
    });

    it('should handle announcements without target audience', async () => {
      const mockAnnouncement = {
        id: 'announcement-456',
        title: 'General Notice',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        content: 'General content',
      };

      mockNotificationService.notifyUsers.mockResolvedValue(undefined);

      await gateway.broadcastNewAnnouncement(mockAnnouncement);

      expect(mockNotificationService.notifyUsers).toHaveBeenCalledWith({
        type: 'new_announcement',
        announcement: mockAnnouncement,
        priority: 'medium', // Mapped from AnnouncementPriority.NORMAL
        targetAudience: ['all'], // Default value
      });
    });

    it('should handle broadcast errors gracefully', async () => {
      const mockAnnouncement = {
        id: 'announcement-error',
        title: 'Error Test',
        priority: AnnouncementPriority.URGENT,
      };

      mockNotificationService.notifyUsers.mockRejectedValue(
        new Error('Notification service error'),
      );

      await expect(
        gateway.broadcastNewAnnouncement(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('broadcastAnnouncementUpdate', () => {
    it('should broadcast announcement updates', async () => {
      const mockAnnouncement = {
        id: 'announcement-update',
        title: 'Updated Event',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.LOW,
        targetAudience: ['developers'],
      };

      mockNotificationService.notifyUsers.mockResolvedValue(undefined);

      await gateway.broadcastAnnouncementUpdate(mockAnnouncement);

      expect(mockNotificationService.notifyUsers).toHaveBeenCalledWith({
        type: 'updated_announcement',
        announcement: mockAnnouncement,
        priority: 'low', // Mapped from AnnouncementPriority.LOW
        targetAudience: ['developers'],
      });
    });

    it('should handle update broadcast errors', async () => {
      const mockAnnouncement = {
        id: 'announcement-update-error',
        title: 'Update Error Test',
        priority: AnnouncementPriority.NORMAL,
      };

      mockNotificationService.notifyUsers.mockRejectedValue(
        new Error('Update broadcast error'),
      );

      await expect(
        gateway.broadcastAnnouncementUpdate(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('sendUrgentNotification', () => {
    it('should send urgent notifications', async () => {
      const mockAnnouncement = {
        id: 'urgent-announcement',
        title: 'Urgent System Maintenance',
        type: AnnouncementType.MAINTENANCE,
        priority: AnnouncementPriority.URGENT,
      };

      mockNotificationService.notifyUrgentAnnouncement.mockResolvedValue(
        undefined,
      );

      await gateway.sendUrgentNotification(mockAnnouncement);

      expect(
        mockNotificationService.notifyUrgentAnnouncement,
      ).toHaveBeenCalledWith(mockAnnouncement);
    });

    it('should handle urgent notification errors', async () => {
      const mockAnnouncement = {
        id: 'urgent-error',
        title: 'Urgent Error Test',
      };

      mockNotificationService.notifyUrgentAnnouncement.mockRejectedValue(
        new Error('Urgent notification error'),
      );

      await expect(
        gateway.sendUrgentNotification(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('sendFeaturedNotification', () => {
    it('should send featured notifications', async () => {
      const mockAnnouncement = {
        id: 'featured-announcement',
        title: 'Featured Event',
        type: AnnouncementType.EVENT,
        isFeatured: true,
      };

      mockNotificationService.notifyFeaturedAnnouncement.mockResolvedValue(
        undefined,
      );

      await gateway.sendFeaturedNotification(mockAnnouncement);

      expect(
        mockNotificationService.notifyFeaturedAnnouncement,
      ).toHaveBeenCalledWith(mockAnnouncement);
    });

    it('should handle featured notification errors', async () => {
      const mockAnnouncement = {
        id: 'featured-error',
        title: 'Featured Error Test',
      };

      mockNotificationService.notifyFeaturedAnnouncement.mockRejectedValue(
        new Error('Featured notification error'),
      );

      await expect(
        gateway.sendFeaturedNotification(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('getConnectionStats', () => {
    it('should return connection statistics in HTTP mode', () => {
      const mockNotificationStats = {
        totalSubscribers: 100,
        activeConnections: 0,
        subscriptionsWithEmail: 25,
        subscriptionsWithPush: 50,
        connectionRate: 0,
      };

      mockNotificationService.getNotificationStats.mockReturnValue(
        mockNotificationStats,
      );

      const stats = gateway.getConnectionStats();

      expect(stats).toEqual({
        totalConnections: 0,
        authenticatedConnections: 0,
        totalSubscribers: 100,
        activeSubscribers: 100,
        subscriptionsWithEmail: 25,
        subscriptionsWithPush: 50,
        connectionRate: 0,
        rooms: [],
        timestamp: expect.any(Date),
        mode: 'http',
        websocketEnabled: false,
      });
    });

    it('should handle errors in getting notification stats', () => {
      mockNotificationService.getNotificationStats.mockImplementation(() => {
        throw new Error('Stats error');
      });

      expect(() => gateway.getConnectionStats()).toThrow('Stats error');
    });
  });

  describe('Priority Mapping', () => {
    it('should map announcement priorities correctly', async () => {
      const testCases = [
        { input: AnnouncementPriority.LOW, expected: 'low' },
        { input: AnnouncementPriority.NORMAL, expected: 'medium' },
        { input: AnnouncementPriority.HIGH, expected: 'high' },
        { input: AnnouncementPriority.URGENT, expected: 'urgent' },
        { input: 'unknown' as any, expected: 'medium' }, // Default case
      ];

      mockNotificationService.notifyUsers.mockResolvedValue(undefined);

      for (const testCase of testCases) {
        const mockAnnouncement = {
          id: `test-${testCase.input}`,
          title: 'Test Announcement',
          priority: testCase.input,
          targetAudience: ['all'],
        };

        await gateway.broadcastNewAnnouncement(mockAnnouncement);

        expect(mockNotificationService.notifyUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: testCase.expected,
          }),
        );

        mockNotificationService.notifyUsers.mockClear();
      }
    });
  });

  describe('Simulated WebSocket Operations', () => {
    it('should simulate joining announcement room', async () => {
      const userId = 'user-123';
      const announcementId = 'announcement-456';

      await expect(
        gateway.joinAnnouncementRoom(userId, announcementId),
      ).resolves.not.toThrow();
    });

    it('should simulate leaving announcement room', async () => {
      const userId = 'user-123';
      const announcementId = 'announcement-456';

      await expect(
        gateway.leaveAnnouncementRoom(userId, announcementId),
      ).resolves.not.toThrow();
    });

    it('should simulate engagement tracking', async () => {
      const userId = 'user-123';
      const announcementId = 'announcement-456';
      const action = 'like';

      await expect(
        gateway.trackEngagement(userId, announcementId, action),
      ).resolves.not.toThrow();
    });
  });

  describe('Error Resilience', () => {
    it('should handle null/undefined announcements', async () => {
      await expect(
        gateway.broadcastNewAnnouncement(null as any),
      ).resolves.not.toThrow();
      await expect(
        gateway.broadcastAnnouncementUpdate(undefined as any),
      ).resolves.not.toThrow();
      await expect(
        gateway.sendUrgentNotification(null as any),
      ).resolves.not.toThrow();
      await expect(
        gateway.sendFeaturedNotification(undefined as any),
      ).resolves.not.toThrow();
    });

    it('should handle service dependency failures', async () => {
      // Simulate notification service being unavailable
      mockNotificationService.notifyUsers.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const mockAnnouncement = {
        id: 'test-resilience',
        title: 'Resilience Test',
        priority: AnnouncementPriority.NORMAL,
      };

      await expect(
        gateway.broadcastNewAnnouncement(mockAnnouncement),
      ).resolves.not.toThrow();
    });
  });

  describe('Configuration and Setup', () => {
    it('should provide complete WebSocket setup instructions', () => {
      const instructions = gateway.getWebSocketSetupInstructions();

      expect(instructions.step1).toContain('@nestjs/websockets');
      expect(instructions.step1).toContain('@nestjs/platform-socket.io');
      expect(instructions.step1).toContain('socket.io');
      expect(instructions.step2).toContain('Replace this file');
      expect(instructions.step3).toContain('Update the module');
      expect(instructions.step4).toContain('Configure CORS');
    });

    it('should list comprehensive benefits of WebSocket upgrade', () => {
      const instructions = gateway.getWebSocketSetupInstructions();

      expect(instructions.benefits).toContain(
        'Real-time bidirectional communication',
      );
      expect(instructions.benefits).toContain('Instant notification delivery');
      expect(instructions.benefits).toContain('Live user presence tracking');
      expect(instructions.benefits).toContain('Real-time engagement metrics');
      expect(instructions.benefits).toContain('Live collaboration features');
    });
  });

  describe('Feature Detection', () => {
    it('should correctly report WebSocket availability', () => {
      expect(gateway.isWebSocketEnabled()).toBe(false);
    });

    it('should provide current feature set', () => {
      const supportedFeatures = gateway.getSupportedFeatures();
      const missingFeatures = gateway.getMissingFeatures();

      // Should have some features
      expect(supportedFeatures.length).toBeGreaterThan(0);

      // Should have missing features (WebSocket features)
      expect(missingFeatures.length).toBeGreaterThan(0);

      // No overlap between supported and missing
      const overlap = supportedFeatures.filter((f) =>
        missingFeatures.includes(f),
      );
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Integration with Services', () => {
    it('should properly integrate with notification service', async () => {
      mockNotificationService.notifyUsers.mockResolvedValue(undefined);
      mockNotificationService.getNotificationStats.mockReturnValue({
        totalSubscribers: 50,
        activeConnections: 0,
        subscriptionsWithEmail: 10,
        subscriptionsWithPush: 20,
        connectionRate: 0,
      });

      const announcement = {
        id: 'integration-test',
        title: 'Integration Test',
        priority: AnnouncementPriority.NORMAL,
      };

      // Test broadcast
      await gateway.broadcastNewAnnouncement(announcement);
      expect(mockNotificationService.notifyUsers).toHaveBeenCalled();

      // Test stats
      const stats = gateway.getConnectionStats();
      expect(stats.totalSubscribers).toBe(50);
      expect(mockNotificationService.getNotificationStats).toHaveBeenCalled();
    });

    it('should handle service integration errors', async () => {
      mockNotificationService.notifyUsers.mockRejectedValue(
        new Error('Service integration error'),
      );

      const announcement = {
        id: 'error-test',
        title: 'Error Test',
      };

      // Should not throw even if service fails
      await expect(
        gateway.broadcastNewAnnouncement(announcement),
      ).resolves.not.toThrow();
      await expect(
        gateway.broadcastAnnouncementUpdate(announcement),
      ).resolves.not.toThrow();
      await expect(
        gateway.sendUrgentNotification(announcement),
      ).resolves.not.toThrow();
      await expect(
        gateway.sendFeaturedNotification(announcement),
      ).resolves.not.toThrow();
    });
  });
});
