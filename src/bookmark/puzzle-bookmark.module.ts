import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Bookmark } from "./entities/bookmark.entity"
import { Puzzle } from "./entities/puzzle.entity"
import { BookmarkService } from "./services/bookmark.service"
import { PuzzleService } from "./services/puzzle.service"
import { BookmarkController } from "./controllers/bookmark.controller"
import { PuzzleController } from "./controllers/puzzle.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Puzzle])],
  controllers: [BookmarkController, PuzzleController],
  providers: [BookmarkService, PuzzleService],
  exports: [BookmarkService, PuzzleService],
})
export class PuzzleBookmarkModule {}
