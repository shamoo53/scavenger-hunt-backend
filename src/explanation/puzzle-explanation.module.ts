import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Explanation } from "./entities/explanation.entity"
import { UserSolution } from "./entities/user-solution.entity"
import { ExplanationService } from "./services/explanation.service"
import { UserSolutionService } from "./services/user-solution.service"
import { ExplanationController } from "./controllers/explanation.controller"
import { UserSolutionController } from "./controllers/user-solution.controller"
import { AdminGuard } from "./guards/admin.guard"

@Module({
  imports: [TypeOrmModule.forFeature([Explanation, UserSolution])],
  controllers: [ExplanationController, UserSolutionController],
  providers: [ExplanationService, UserSolutionService, AdminGuard],
  exports: [ExplanationService, UserSolutionService],
})
export class PuzzleExplanationModule {}
