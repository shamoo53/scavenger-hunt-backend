export class CooldownStatusDto {
  isOnCooldown: boolean
  remainingTimeSeconds: number
  remainingTimeFormatted: string
  canAttempt: boolean
  nextAttemptAt: Date | null
  attemptCount: number
  maxAttempts: number
  cooldownType: string
  baseCooldownSeconds: number

  constructor(data: {
    isOnCooldown: boolean
    remainingTimeSeconds: number
    canAttempt: boolean
    nextAttemptAt: Date | null
    attemptCount: number
    maxAttempts: number
    cooldownType: string
    baseCooldownSeconds: number
  }) {
    this.isOnCooldown = data.isOnCooldown
    this.remainingTimeSeconds = data.remainingTimeSeconds
    this.remainingTimeFormatted = this.formatTime(data.remainingTimeSeconds)
    this.canAttempt = data.canAttempt
    this.nextAttemptAt = data.nextAttemptAt
    this.attemptCount = data.attemptCount
    this.maxAttempts = data.maxAttempts
    this.cooldownType = data.cooldownType
    this.baseCooldownSeconds = data.baseCooldownSeconds
  }

  private formatTime(seconds: number): string {
    if (seconds <= 0) return "0s"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`)

    return parts.join(" ")
  }
}
