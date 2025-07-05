import { Injectable, Logger } from "@nestjs/common"
import type { SubscriptionService } from "./subscription.service"
import type { NotificationDto, BroadcastNotificationDto } from "../dto/notification.dto"

export interface NotificationPayload {
  userId: string
  puzzleId: string
  puzzleTitle: string
  message: string
  type: "NEW_PUZZLE"
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(private readonly subscriptionService: SubscriptionService) {}

  async detectAndNotifyNewPuzzle(notificationDto: NotificationDto): Promise<void> {
    const { puzzleId, puzzleTitle, categoryId, tagId } = notificationDto

    if (!categoryId && !tagId) {
      this.logger.warn(`No category or tag specified for puzzle ${puzzleId}`)
      return
    }

    const subscriberIds = new Set<string>()

    // Get subscribers by category
    if (categoryId) {
      const categorySubscribers = await this.subscriptionService.getSubscribersByCategory(categoryId)
      categorySubscribers.forEach((id) => subscriberIds.add(id))
    }

    // Get subscribers by tag
    if (tagId) {
      const tagSubscribers = await this.subscriptionService.getSubscribersByTag(tagId)
      tagSubscribers.forEach((id) => subscriberIds.add(id))
    }

    // Send notifications to all unique subscribers
    const notifications: NotificationPayload[] = Array.from(subscriberIds).map((userId) => ({
      userId,
      puzzleId,
      puzzleTitle,
      message: `New puzzle "${puzzleTitle}" is now available!`,
      type: "NEW_PUZZLE" as const,
    }))

    await this.sendNotifications(notifications)

    this.logger.log(`Sent ${notifications.length} notifications for puzzle: ${puzzleTitle}`)
  }

  async broadcastPuzzleNotification(broadcastDto: BroadcastNotificationDto): Promise<number> {
    const { puzzleId, puzzleTitle, categoryId, tagId } = broadcastDto

    if (!categoryId && !tagId) {
      this.logger.warn(`No category or tag specified for broadcast of puzzle ${puzzleId}`)
      return 0
    }

    const subscriberIds = new Set<string>()

    // Get subscribers by category
    if (categoryId) {
      const categorySubscribers = await this.subscriptionService.getSubscribersByCategory(categoryId)
      categorySubscribers.forEach((id) => subscriberIds.add(id))
    }

    // Get subscribers by tag
    if (tagId) {
      const tagSubscribers = await this.subscriptionService.getSubscribersByTag(tagId)
      tagSubscribers.forEach((id) => subscriberIds.add(id))
    }

    // Send notifications to all unique subscribers
    const notifications: NotificationPayload[] = Array.from(subscriberIds).map((userId) => ({
      userId,
      puzzleId,
      puzzleTitle,
      message: `Don't miss the puzzle "${puzzleTitle}"!`,
      type: "NEW_PUZZLE" as const,
    }))

    await this.sendNotifications(notifications)

    this.logger.log(`Broadcast ${notifications.length} notifications for puzzle: ${puzzleTitle}`)
    return notifications.length
  }

  private async sendNotifications(notifications: NotificationPayload[]): Promise<void> {
    // In a real implementation, this would integrate with:
    // - Push notification service (Firebase, OneSignal, etc.)
    // - WebSocket for real-time notifications
    // - Email service
    // - In-app notification storage

    // For now, we'll simulate the notification sending
    for (const notification of notifications) {
      await this.simulateNotificationSend(notification)
    }
  }

  private async simulateNotificationSend(notification: NotificationPayload): Promise<void> {
    // Simulate async notification sending (e.g., API call to push service)
    return new Promise((resolve) => {
      setTimeout(() => {
        this.logger.debug(`Notification sent to user ${notification.userId}: ${notification.message}`)
        resolve()
      }, 10)
    })
  }

  // Method to get notification history (for testing purposes)
  async getNotificationHistory(): Promise<NotificationPayload[]> {
    // In a real implementation, this would fetch from a notifications table
    // For testing, we'll return an empty array
    return []
  }
}
