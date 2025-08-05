// src/puzzle-timers/puzzle-timers.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleTimersService } from './puzzle-timers.service';
import { PuzzleTimersController } from './puzzle-timers.controller';
import { PuzzleTimer } from './entities/puzzle-timer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PuzzleTimer])],
  controllers: [PuzzleTimersController],
  providers: [PuzzleTimersService],
  exports: [PuzzleTimersService], // Optional: export if other modules need this service
})
export class PuzzleTimersModule {}