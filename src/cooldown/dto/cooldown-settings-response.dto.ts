import type { CooldownType } from "../entities/cooldown-settings.entity"

export class CooldownSettingsResponseDto {
  id: string
  puzzleId: string | null
  cooldownType: CooldownType
  baseCooldownSeconds: number
  maxCooldownSeconds: number | null
  multiplier: number
  maxAttempts: number
  isActive: boolean
  metadata: any
  createdAt: Date
  updatedAt: Date

  constructor(settings: any) {
    this.id = settings.id
    this.puzzleId = settings.puzzleId
    this.cooldownType = settings.cooldownType
    this.baseCooldownSeconds = settings.baseCooldownSeconds
    this.maxCooldownSeconds = settings.maxCooldownSeconds
    this.multiplier = settings.multiplier
    this.maxAttempts = settings.maxAttempts
    this.isActive = settings.isActive
    this.metadata = settings.metadata
    this.createdAt = settings.createdAt
    this.updatedAt = settings.updatedAt
  }
}
