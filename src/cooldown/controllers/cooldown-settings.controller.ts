import { Controller, Post, Get, Put, Delete, HttpCode, HttpStatus } from "@nestjs/common"
import type { CooldownSettingsService } from "../services/cooldown-settings.service"
import type { CreateCooldownSettingsDto } from "../dto/create-cooldown-settings.dto"
import type { CooldownSettingsResponseDto } from "../dto/cooldown-settings-response.dto"

@Controller("cooldown-settings")
export class CooldownSettingsController {
  constructor(private readonly cooldownSettingsService: CooldownSettingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCooldownSettings(createDto: CreateCooldownSettingsDto): Promise<CooldownSettingsResponseDto> {
    return this.cooldownSettingsService.createCooldownSettings(createDto)
  }

  @Get()
  async getAllCooldownSettings(): Promise<CooldownSettingsResponseDto[]> {
    return this.cooldownSettingsService.getAllCooldownSettings()
  }

  @Get("active")
  async getActiveCooldownSettings(): Promise<CooldownSettingsResponseDto[]> {
    return this.cooldownSettingsService.getActiveCooldownSettings()
  }

  @Get("puzzle/:puzzleId")
  async getCooldownSettingsForPuzzle(puzzleId: string): Promise<CooldownSettingsResponseDto> {
    return this.cooldownSettingsService.getCooldownSettings(puzzleId)
  }

  @Get("global")
  async getGlobalCooldownSettings(): Promise<CooldownSettingsResponseDto> {
    return this.cooldownSettingsService.getCooldownSettings()
  }

  @Put(":id")
  async updateCooldownSettings(id: string, updateDto: CreateCooldownSettingsDto): Promise<CooldownSettingsResponseDto> {
    return this.cooldownSettingsService.updateCooldownSettings(id, updateDto)
  }

  @Put(":id/toggle")
  async toggleCooldownSettings(id: string): Promise<CooldownSettingsResponseDto> {
    return this.cooldownSettingsService.toggleCooldownSettings(id)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCooldownSettings(id: string): Promise<void> {
    return this.cooldownSettingsService.deleteCooldownSettings(id)
  }
}
