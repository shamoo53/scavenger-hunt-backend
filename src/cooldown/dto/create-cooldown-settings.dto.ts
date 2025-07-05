import { IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from "class-validator"
import { CooldownType } from "../entities/cooldown-settings.entity"

export class CreateCooldownSettingsDto {
  @IsOptional()
  @IsUUID()
  puzzleId?: string // null for global default

  @IsOptional()
  @IsEnum(CooldownType)
  cooldownType?: CooldownType

  @IsOptional()
  @IsNumber()
  @Min(1, { message: "Base cooldown must be at least 1 second" })
  @Max(604800, { message: "Base cooldown cannot exceed 7 days (604800 seconds)" })
  baseCooldownSeconds?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCooldownSeconds?: number

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10.0)
  multiplier?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttempts?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  metadata?: any
}
