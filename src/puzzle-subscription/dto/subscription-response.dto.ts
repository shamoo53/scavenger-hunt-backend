export class SubscriptionResponseDto {
  id: string
  userId: string
  categoryId: string | null
  tagId: string | null
  createdAt: Date

  constructor(subscription: any) {
    this.id = subscription.id
    this.userId = subscription.userId
    this.categoryId = subscription.categoryId
    this.tagId = subscription.tagId
    this.createdAt = subscription.createdAt
  }
}
