// src/starknet-quiz/starknet-quiz.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StarknetQuizService } from './starknet-quiz.service';
import { StarknetQuizController } from './starknet-quiz.controller';
import { StarknetQuiz } from './entities/starknet-quiz.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StarknetQuiz])],
  controllers: [StarknetQuizController],
  providers: [StarknetQuizService],
})
export class StarknetQuizModule {}