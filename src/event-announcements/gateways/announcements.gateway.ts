import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AnnouncementNotificationService } from '../services/notification.service';
import { EventAnnouncementsService } from '../event-announcements.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/announcements',
})
export class AnnouncementsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnnouncementsGateway.name);

  constructor(
    private readonly notificationService: AnnouncementNotificationService,
    private readonly announcementsService: EventAnnouncementsService,
  ) {}

  /**
   * Handle new client connections
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract user ID from token or session (simplified for demo)
      const userId = this.extractUserIdFromSocket(client);
      
      if (userId) {
        client.userId = userId;
        this.notificationService.registerSocketConnection(userId, client);
        
        // Join user to their personal room
        client.join(`user_${userId}`);
        
        // Send welcome message with recent announcements
        const recentAnnouncements = await this.announcementsService.findPublished();
        client.emit('recent_announcements', {
          announcements: recentAnnouncements.slice(0, 5),
          timestamp: new Date()
        });

        this.logger.debug(`User ${userId} connected to announcements gateway`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnections
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    try {
      if (client.userId) {
        this.notificationService.removeSocketConnection(client.userId);
        this.logger.debug(`User ${client.userId} disconnected from announcements gateway`);
      }
    } catch (error) {
      this.logger.error(`Disconnection error: ${error.message}`);
    }
  }

  /**
   * Subscribe to announcement notifications
   */
  @SubscribeMessage('subscribe_notifications')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { categories?: string[]; types?: string[]; preferences?: any }
  ): Promise<void> {
    try {
      if (!client.userId) return;

      await this.notificationService.subscribeUser(client.userId, {
        categories: data.categories,
        types: data.types,
        preferences: data.preferences
      });

      // Join category-specific rooms
      if (data.categories) {
        data.categories.forEach(category => {
          client.join(`category_${category}`);
        });
      }

      client.emit('subscription_confirmed', {
        success: true,
        categories: data.categories,
        types: data.types,
        timestamp: new Date()
      });

      this.logger.debug(`User ${client.userId} subscribed to notifications`);
    } catch (error) {
      this.logger.error(`Subscription error: ${error.message}`);
      client.emit('subscription_error', { error: error.message });
    }
  }

  /**
   * Unsubscribe from notifications
   */
  @SubscribeMessage('unsubscribe_notifications')
  async handleUnsubscribe(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    try {
      if (!client.userId) return;

      await this.notificationService.unsubscribeUser(client.userId);
      
      client.emit('unsubscribe_confirmed', {
        success: true,
        timestamp: new Date()
      });

      this.logger.debug(`User ${client.userId} unsubscribed from notifications`);
    } catch (error) {
      this.logger.error(`Unsubscribe error: ${error.message}`);
      client.emit('unsubscribe_error', { error: error.message });
    }
  }

  /**
   * Update notification preferences
   */
  @SubscribeMessage('update_preferences')
  async handleUpdatePreferences(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() preferences: any
  ): Promise<void> {
    try {
      if (!client.userId) return;

      await this.notificationService.updateUserPreferences(client.userId, preferences);
      
      client.emit('preferences_updated', {
        success: true,
        preferences,
        timestamp: new Date()
      });

      this.logger.debug(`Updated preferences for user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Preferences update error: ${error.message}`);
      client.emit('preferences_error', { error: error.message });
    }
  }

  /**
   * Request live announcement statistics
   */
  @SubscribeMessage('get_live_stats')
  async handleGetLiveStats(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    try {
      const stats = await this.announcementsService.getAnnouncementStatistics();
      const notificationStats = this.notificationService.getNotificationStats();

      client.emit('live_stats', {
        announcements: stats,
        notifications: notificationStats,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Live stats error: ${error.message}`);
      client.emit('stats_error', { error: error.message });
    }
  }

  /**
   * Join specific announcement room for real-time updates
   */
  @SubscribeMessage('join_announcement')
  async handleJoinAnnouncement(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { announcementId: string }
  ): Promise<void> {
    try {
      const { announcementId } = data;
      
      // Verify announcement exists
      const announcement = await this.announcementsService.findOne(announcementId);
      if (!announcement) {
        client.emit('join_error', { error: 'Announcement not found' });
        return;
      }

      client.join(`announcement_${announcementId}`);
      
      client.emit('joined_announcement', {
        announcementId,
        timestamp: new Date()
      });

      this.logger.debug(`User ${client.userId} joined announcement ${announcementId}`);
    } catch (error) {
      this.logger.error(`Join announcement error: ${error.message}`);
      client.emit('join_error', { error: error.message });
    }
  }

  /**
   * Leave announcement room
   */
  @SubscribeMessage('leave_announcement')
  handleLeaveAnnouncement(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { announcementId: string }
  ): void {
    try {
      const { announcementId } = data;
      client.leave(`announcement_${announcementId}`);
      
      client.emit('left_announcement', {
        announcementId,
        timestamp: new Date()
      });

      this.logger.debug(`User ${client.userId} left announcement ${announcementId}`);
    } catch (error) {
      this.logger.error(`Leave announcement error: ${error.message}`);
    }
  }

  /**
   * Handle real-time engagement tracking
   */
  @SubscribeMessage('track_engagement')
  async handleTrackEngagement(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      announcementId: string;
      action: 'view' | 'like' | 'share' | 'click';
      metadata?: any;
    }
  ): Promise<void> {
    try {
      if (!client.userId) return;

      const { announcementId, action, metadata } = data;

      // Track the engagement (you would integrate with analytics service here)
      // await this.analyticsService.trackEngagement({
      //   userId: client.userId,
      //   announcementId,
      //   action,
      //   metadata
      // });

      // Broadcast engagement to announcement room (optional)
      this.server.to(`announcement_${announcementId}`).emit('engagement_update', {
        action,
        timestamp: new Date(),
        totalUsers: this.server.sockets.adapter.rooms.get(`announcement_${announcementId}`)?.size || 0
      });

      this.logger.debug(`Tracked ${action} engagement for announcement ${announcementId} by user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Engagement tracking error: ${error.message}`);
    }
  }

  /**
   * Broadcast new announcement to all subscribed users
   */
  async broadcastNewAnnouncement(announcement: any): Promise<void> {
    try {
      // Broadcast to all connected users
      this.server.emit('new_announcement', {
        announcement,
        timestamp: new Date()
      });

      // Broadcast to category-specific rooms
      if (announcement.category) {
        this.server.to(`category_${announcement.category}`).emit('category_announcement', {
          announcement,
          category: announcement.category,
          timestamp: new Date()
        });
      }

      this.logger.debug(`Broadcasted new announcement ${announcement.id} to all users`);
    } catch (error) {
      this.logger.error(`Broadcast error: ${error.message}`);
    }
  }

  /**
   * Broadcast announcement updates
   */
  async broadcastAnnouncementUpdate(announcement: any): Promise<void> {
    try {
      // Broadcast to announcement-specific room
      this.server.to(`announcement_${announcement.id}`).emit('announcement_updated', {
        announcement,
        timestamp: new Date()
      });

      this.logger.debug(`Broadcasted update for announcement ${announcement.id}`);
    } catch (error) {
      this.logger.error(`Broadcast update error: ${error.message}`);
    }
  }

  /**
   * Send urgent notification to all connected users
   */
  async sendUrgentNotification(announcement: any): Promise<void> {
    try {
      this.server.emit('urgent_announcement', {
        announcement,
        priority: 'urgent',
        timestamp: new Date()
      });

      this.logger.log(`Sent urgent notification for announcement ${announcement.id}`);
    } catch (error) {
      this.logger.error(`Urgent notification error: ${error.message}`);
    }
  }

  /**
   * Get current connection statistics
   */
  getConnectionStats(): Record<string, any> {
    const connectedSockets = this.server.sockets.sockets;
    const totalConnections = connectedSockets.size;
    const authenticatedConnections = Array.from(connectedSockets.values())
      .filter(socket => (socket as AuthenticatedSocket).userId).length;

    return {
      totalConnections,
      authenticatedConnections,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
      timestamp: new Date()
    };
  }

  // Private helper methods

  private extractUserIdFromSocket(socket: AuthenticatedSocket): string | null {
    try {
      // In a real implementation, you would extract this from JWT token or session
      // For demo purposes, we'll use a query parameter
      const userId = socket.handshake.query.userId as string;
      
      if (!userId) {
        this.logger.warn('No userId provided in socket connection');
        return null;
      }

      return userId;
    } catch (error) {
      this.logger.error(`Failed to extract user ID: ${error.message}`);
      return null;
    }
  }
}