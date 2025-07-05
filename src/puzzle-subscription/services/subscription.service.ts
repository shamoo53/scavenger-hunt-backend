import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Subscription } from "../entities/subscription.entity"
import type { CreateSubscriptionDto } from "../dto/create-subscription.dto"
import { SubscriptionResponseDto } from "../dto/subscription-response.dto"

@Injectable()
export class SubscriptionService {
  private readonly subscriptionRepository: Repository<Subscription>

  constructor(subscriptionRepository: Repository<Subscription>) {
    this.subscriptionRepository = subscriptionRepository
  }

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const { userId, categoryId, tagId } = createSubscriptionDto

    // Validate that exactly one of categoryId or tagId is provided
    if ((!categoryId && !tagId) || (categoryId && tagId)) {
      throw new BadRequestException("Either categoryId or tagId must be provided, but not both")
    }

    // Check if subscription already exists
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: categoryId ? { userId, categoryId } : { userId, tagId },
    })

    if (existingSubscription) {
      throw new ConflictException("Subscription already exists")
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      categoryId: categoryId || null,
      tagId: tagId || null,
    })

    const savedSubscription = await this.subscriptionRepository.save(subscription)
    return new SubscriptionResponseDto(savedSubscription)
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    })

    return subscriptions.map((sub) => new SubscriptionResponseDto(sub))
  }

  async deleteSubscription(subscriptionId: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    })

    if (!subscription) {
      throw new NotFoundException("Subscription not found")
    }

    await this.subscriptionRepository.remove(subscription)
  }

  async getSubscribersByCategory(categoryId: string): Promise<string[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { categoryId },
      select: ["userId"],
    })

    return subscriptions.map((sub) => sub.userId)
  }

  async getSubscribersByTag(tagId: string): Promise<string[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { tagId },
      select: ["userId"],
    })

    return subscriptions.map((sub) => sub.userId)
  }

  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionRepository.find({
      order: { createdAt: "DESC" },
    })

    return subscriptions.map((sub) => new SubscriptionResponseDto(sub))
  }
}
