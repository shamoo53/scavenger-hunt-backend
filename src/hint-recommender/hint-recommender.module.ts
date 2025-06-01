/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HintRecommenderService } from './hint-recommender.service';

@Module({
  providers: [HintRecommenderService],
  exports: [HintRecommenderService],
})
export class HintRecommenderModule {}
