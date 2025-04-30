import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameProgressController } from './game-progress.controller';
import { GameProgressService } from './game-progress.service';
import { GameProgress } from './entities/game-progress.entity';
import { Achievement } from './entities/achievement.entity';
import { Game } from '../games/entities/game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameProgress, Achievement, Game]),
  ],
  controllers: [GameProgressController],
  providers: [GameProgressService],
  exports: [GameProgressService],
})
export class GameProgressModule {}