import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { GameSessionController } from "./game-session.controller"
import { GameSessionService } from "./game-session.service"
import { GameSession } from "./game-session.entity"
import { QuestionsModule } from "../questions/questions.module"
import { LeaderboardModule } from "../leaderboard/leaderboard.module"

@Module({
  imports: [TypeOrmModule.forFeature([GameSession]), QuestionsModule, LeaderboardModule],
  controllers: [GameSessionController],
  providers: [GameSessionService],
  exports: [GameSessionService],
})
export class GameSessionModule {}
