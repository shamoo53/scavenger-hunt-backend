import { Controller, Post, HttpCode, HttpStatus } from "@nestjs/common"
import type { NotificationService } from "../services/notification.service"
import type { NotificationDto, BroadcastNotificationDto } from "../dto/notification.dto"

@Controller("puzzle-notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("detect")
  @HttpCode(HttpStatus.OK)
  async detectAndNotify(notificationDto: NotificationDto): Promise<{ message: string }> {
    await this.notificationService.detectAndNotifyNewPuzzle(notificationDto)
    return { message: "Notifications sent successfully" }
  }

  @Post("broadcast")
  @HttpCode(HttpStatus.OK)
  async broadcastNotification(broadcastDto: BroadcastNotificationDto): Promise<{ message: string; count: number }> {
    const count = await this.notificationService.broadcastPuzzleNotification(broadcastDto)
    return {
      message: "Broadcast notifications sent successfully",
      count,
    }
  }
}
