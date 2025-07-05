import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Subscription } from "./entities/subscription.entity"
import { SubscriptionService } from "./services/subscription.service"
import { NotificationService } from "./services/notification.service"
import { SubscriptionController } from "./controllers/subscription.controller"
import { NotificationController } from "./controllers/notification.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [SubscriptionController, NotificationController],
  providers: [SubscriptionService, NotificationService],
  exports: [SubscriptionService, NotificationService],
})
export class PuzzleSubscriptionModule {}
