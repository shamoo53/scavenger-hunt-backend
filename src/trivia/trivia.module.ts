import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriviaController } from './trivia.controller';
import { TriviaService } from './trivia.service';
import { TriviaCard } from './entities/trivia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TriviaCard])],
  controllers: [TriviaController],
  providers: [TriviaService],
})
export class TriviaModule {}

