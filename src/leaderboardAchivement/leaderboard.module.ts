import { Module } from "@nestjs/common"
import { LeaderboardServiceImpl } from "./leaderboard.service"
import { LeaderboardController } from "./leaderboard.controller"

@Module({
  providers: [LeaderboardServiceImpl],
  controllers: [LeaderboardController],
  exports: [LeaderboardServiceImpl],
})
export class LeaderboardModule {}
