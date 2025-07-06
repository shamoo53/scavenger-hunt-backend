import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesController } from './puzzles.controller';
import { Puzzle } from './entities/puzzle.entity';
import { AuthModule } from '../auth/auth.module';
import { PuzzleDraft } from '../puzzle-drafts/entities/puzzle-draft.entity'; 
import { ContentCreatorGuard } from '../auth/guards/content-creator.guard'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([Puzzle, PuzzleDraft]), 
    AuthModule,
  ],
  controllers: [PuzzlesController],
  providers: [PuzzlesService, ContentCreatorGuard], // Provide the new guard
  exports: [PuzzlesService],
})
export class PuzzlesModule {}