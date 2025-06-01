/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HintRecommenderModule } from '../hint-recommender/hint-recommender.module';
import { ExampleService } from './example.service';

@Module({
  imports: [HintRecommenderModule],
  providers: [ExampleService],
})
export class ExampleModule {}
