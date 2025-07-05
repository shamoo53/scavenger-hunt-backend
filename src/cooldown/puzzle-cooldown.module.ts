import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Cooldown } from "./entities/cooldown.entity"
import { CooldownSettings } from "./entities/cooldown-settings.entity"
import { Puzzle } from "./entities/puzzle.entity"
import { CooldownService } from "./services/cooldown.service"
import { CooldownSettingsService } from "./services/cooldown-settings.service"
import { CooldownController } from "./controllers/cooldown.controller"
import { CooldownSettingsController } from "./controllers/cooldown-settings.controller"
import { CooldownGuard } from "./guards/cooldown.guard"

@Module({
  imports: [TypeOrmModule.forFeature([Cooldown, CooldownSettings, Puzzle])],
  controllers: [CooldownController, CooldownSettingsController],
  providers: [CooldownService, CooldownSettingsService, CooldownGuard],
  exports: [CooldownService, CooldownSettingsService, CooldownGuard],
})
export class PuzzleCooldownModule {}
