import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type CooldownSettings, CooldownType } from "../entities/cooldown-settings.entity"
import type { CreateCooldownSettingsDto } from "../dto/create-cooldown-settings.dto"
import { CooldownSettingsResponseDto } from "../dto/cooldown-settings-response.dto"

@Injectable()
export class CooldownSettingsService {
  private readonly cooldownSettingsRepository: Repository<CooldownSettings>

  constructor(cooldownSettingsRepository: Repository<CooldownSettings>) {
    this.cooldownSettingsRepository = cooldownSettingsRepository
  }

  async createCooldownSettings(createDto: CreateCooldownSettingsDto): Promise<CooldownSettingsResponseDto> {
    const {
      puzzleId,
      cooldownType,
      baseCooldownSeconds,
      maxCooldownSeconds,
      multiplier,
      maxAttempts,
      isActive,
      metadata,
    } = createDto

    // Check if settings already exist for this puzzle
    const existingSettings = await this.cooldownSettingsRepository.findOne({
      where: { puzzleId: puzzleId || null },
    })

    if (existingSettings) {
      throw new ConflictException(`Cooldown settings already exist for ${puzzleId ? "puzzle" : "global default"}`)
    }

    const settings = this.cooldownSettingsRepository.create({
      puzzleId: puzzleId || null,
      cooldownType: cooldownType || CooldownType.FIXED,
      baseCooldownSeconds: baseCooldownSeconds || 43200, // 12 hours default
      maxCooldownSeconds: maxCooldownSeconds || null,
      multiplier: multiplier || 1.0,
      maxAttempts: maxAttempts || 0,
      isActive: isActive !== undefined ? isActive : true,
      metadata: metadata || null,
    })

    const savedSettings = await this.cooldownSettingsRepository.save(settings)
    return new CooldownSettingsResponseDto(savedSettings)
  }

  async updateCooldownSettings(
    settingsId: string,
    updateDto: CreateCooldownSettingsDto,
  ): Promise<CooldownSettingsResponseDto> {
    const settings = await this.cooldownSettingsRepository.findOne({
      where: { id: settingsId },
    })

    if (!settings) {
      throw new NotFoundException("Cooldown settings not found")
    }

    // Update fields if provided
    if (updateDto.cooldownType !== undefined) settings.cooldownType = updateDto.cooldownType
    if (updateDto.baseCooldownSeconds !== undefined) settings.baseCooldownSeconds = updateDto.baseCooldownSeconds
    if (updateDto.maxCooldownSeconds !== undefined) settings.maxCooldownSeconds = updateDto.maxCooldownSeconds
    if (updateDto.multiplier !== undefined) settings.multiplier = updateDto.multiplier
    if (updateDto.maxAttempts !== undefined) settings.maxAttempts = updateDto.maxAttempts
    if (updateDto.isActive !== undefined) settings.isActive = updateDto.isActive
    if (updateDto.metadata !== undefined) settings.metadata = updateDto.metadata

    const updatedSettings = await this.cooldownSettingsRepository.save(settings)
    return new CooldownSettingsResponseDto(updatedSettings)
  }

  async getCooldownSettings(puzzleId?: string): Promise<CooldownSettingsResponseDto> {
    const settings = await this.cooldownSettingsRepository.findOne({
      where: { puzzleId: puzzleId || null },
    })

    if (!settings) {
      throw new NotFoundException(`Cooldown settings not found for ${puzzleId ? "puzzle" : "global default"}`)
    }

    return new CooldownSettingsResponseDto(settings)
  }

  async getAllCooldownSettings(): Promise<CooldownSettingsResponseDto[]> {
    const settings = await this.cooldownSettingsRepository.find({
      order: { createdAt: "DESC" },
    })

    return settings.map((setting) => new CooldownSettingsResponseDto(setting))
  }

  async deleteCooldownSettings(settingsId: string): Promise<void> {
    const settings = await this.cooldownSettingsRepository.findOne({
      where: { id: settingsId },
    })

    if (!settings) {
      throw new NotFoundException("Cooldown settings not found")
    }

    await this.cooldownSettingsRepository.remove(settings)
  }

  async getActiveCooldownSettings(): Promise<CooldownSettingsResponseDto[]> {
    const settings = await this.cooldownSettingsRepository.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    })

    return settings.map((setting) => new CooldownSettingsResponseDto(setting))
  }

  async toggleCooldownSettings(settingsId: string): Promise<CooldownSettingsResponseDto> {
    const settings = await this.cooldownSettingsRepository.findOne({
      where: { id: settingsId },
    })

    if (!settings) {
      throw new NotFoundException("Cooldown settings not found")
    }

    settings.isActive = !settings.isActive
    const updatedSettings = await this.cooldownSettingsRepository.save(settings)

    return new CooldownSettingsResponseDto(updatedSettings)
  }
}
