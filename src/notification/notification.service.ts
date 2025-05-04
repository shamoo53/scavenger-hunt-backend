import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    const savedNotification = await this.notificationsRepository.save(notification);
    
    // Emit the notification to the connected clients
    this.notificationsGateway.sendNotificationToUser(
      savedNotification.userId,
      savedNotification,
    );
    
    return savedNotification;
  }

  async findAllForUser(userId: string, skip = 0, take = 20): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async findUnreadCountForUser(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, read: false },
    });
  }

  async findOne(id: string): Promise<Notification> {
    return this.notificationsRepository.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.read = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsReadForUser(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, read: false },
      { read: true }
    );
  }

  async deleteOne(id: string): Promise<void> {
    await this.notificationsRepository.delete(id);
  }

  // Utility methods for creating specific notification types
  async notifyChallengeUpdate(userId: string, message: string, challengeId: string): Promise<Notification> {
    return this.create({
      type: NotificationType.CHALLENGE_UPDATE,
      message,
      userId,
      payload: { challengeId },
    });
  }

  async notifyNewGame(userId: string, message: string, gameId: string): Promise<Notification> {
    return this.create({
      type: NotificationType.NEW_GAME,
      message,
      userId,
      payload: { gameId },
    });
  }

  async notifyRewardEarned(userId: string, message: string, rewardId: string): Promise<Notification> {
    return this.create({
      type: NotificationType.REWARD_EARNED,
      message,
      userId,
      payload: { rewardId },
    });
  }

  async notifyLeaderboardUpdate(userId: string, message: string, leaderboardId: string, rank: number): Promise<Notification> {
    return this.create({
      type: NotificationType.LEADERBOARD_UPDATE,
      message,
      userId,
      payload: { leaderboardId, rank },
    });
  }

  async notifySystemMessage(userId: string, message: string): Promise<Notification> {
    return this.create({
      type: NotificationType.SYSTEM_MESSAGE,
      message,
      userId,
    });
  }
}
