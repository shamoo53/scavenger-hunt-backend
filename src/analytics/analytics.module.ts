import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"
import { LeaderboardEntry } from "../leaderboard/leaderboard.entity"
import { Question } from "../questions/question.entity"
import { GameSession } from "../game-session/game-session.entity"

@Module({
  imports: [TypeOrmModule.forFeature([LeaderboardEntry, Question, GameSession])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
