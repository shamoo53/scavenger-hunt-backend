import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleUnlockService } from './puzzle-unlock.service';
import { PuzzleUnlockController } from './puzzle-unlock.controller';
import { Unlock } from './entities/unlock.entity';
import { UnlockRequirement } from './entities/unlock-requirement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Unlock, UnlockRequirement]),
  ],
  controllers: [PuzzleUnlockController],
  providers: [PuzzleUnlockService],
  exports: [PuzzleUnlockService], 
})
export class PuzzleUnlockModule {}