import { Controller, Post, Get, Delete, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import type { SubscriptionService } from "../services/subscription.service"
import type { CreateSubscriptionDto } from "../dto/create-subscription.dto"
import type { SubscriptionResponseDto } from "../dto/subscription-response.dto"

@Controller("puzzle-subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.createSubscription(createSubscriptionDto)
  }

  @Get('user/:userId')
  async getUserSubscriptions(@Param('userId') userId: string): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.getUserSubscriptions(userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscription(@Param('id') subscriptionId: string, @Query('userId') userId: string): Promise<void> {
    return this.subscriptionService.deleteSubscription(subscriptionId, userId)
  }

  @Get()
  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.getAllSubscriptions()
  }
}
