/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HintRecommenderService } from './hint-recommender.service';

@Injectable()
export class ExampleService implements OnModuleInit {
  constructor(private readonly hintRecommender: HintRecommenderService) {}

  async onModuleInit() {
    // your example() code here
    const pastData = []; // TODO: replace with actual dummy data if needed

    this.hintRecommender.setMethod('decision_tree');
    this.hintRecommender.train(pastData);

    const userFeatures = [2, 4];
    const recs = this.hintRecommender.recommend(userFeatures, 2);
    console.log('Top hints:', recs);
  }
}
