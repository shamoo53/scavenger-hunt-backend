export class CooldownResponseDto {
  id: string
  userId: string
  puzzleId: string
  lastAttemptAt: Date
  cooldownExpiresAt: Date | null
  attemptCount: number
  createdAt: Date
  updatedAt: Date

  constructor(cooldown: any) {
    this.id = cooldown.id
    this.userId = cooldown.userId
    this.puzzleId = cooldown.puzzleId
    this.lastAttemptAt = cooldown.lastAttemptAt
    this.cooldownExpiresAt = cooldown.cooldownExpiresAt
    this.attemptCount = cooldown.attemptCount
    this.createdAt = cooldown.createdAt
    this.updatedAt = cooldown.updatedAt
  }
}
