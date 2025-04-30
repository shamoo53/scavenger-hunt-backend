import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { LevelsController } from "./levels.controller"
import { LevelsService } from "./levels.service"
import { Level } from "./entities/level.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService], // Export the service to be used in other modules if needed
})
export class LevelsModule {}
