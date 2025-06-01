/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { DecisionTreeRegression } from 'ml-cart';
import MLR from 'ml-regression-multivariate-linear';

interface UserHintData {
  features: number[]; // e.g. [feature1, feature2, ...]
  hint: string; // hint string label
  successScore: number; // target value to predict
}

@Injectable()
export class HintRecommenderService {
  // Store unique hints and encode hints as numbers
  private hints: string[] = [];
  private hintToIndex = new Map<string, number>();

  // Model: either DecisionTreeRegression or Multivariate Linear Regression
  private dtModel: DecisionTreeRegression | null = null;
  private lrModel: MLR | null = null;

  // Which algorithm to use
  private method: 'decision_tree' | 'linear_regression' = 'decision_tree';

  constructor() {}

  setMethod(method: 'decision_tree' | 'linear_regression') {
    this.method = method;
  }

  private encodeHints(data: UserHintData[]) {
    // Extract unique hints
    const uniqueHints = Array.from(new Set(data.map((d) => d.hint)));
    this.hints = uniqueHints;
    this.hintToIndex.clear();
    uniqueHints.forEach((h, i) => this.hintToIndex.set(h, i));
  }

  train(data: UserHintData[]) {
    this.encodeHints(data);

    // Prepare training data: features + hintEncoded
    // Each input vector = [...features, hintEncoded]
    const X = data.map((d) => [...d.features, this.hintToIndex.get(d.hint)!]);
    const y = data.map((d) => [d.successScore]); // Make y a 2D array

    if (this.method === 'decision_tree') {
      this.dtModel = new DecisionTreeRegression({ maxDepth: 5 });
      this.dtModel.train(
        X,
        y.map((arr) => arr[0]),
      ); // flatten y for decision tree
      this.lrModel = null;
    } else {
      this.lrModel = new MLR(X, y);
      this.dtModel = null;
    }
  }

  recommend(userFeatures: number[], topK = 3): string[] {
    if (this.dtModel === null && this.lrModel === null) {
      throw new Error('Model is not trained yet.');
    }
    if (userFeatures.length === 0) {
      throw new Error('User features are required');
    }

    // For each hint, predict successScore
    const scoredHints = this.hints.map((hint) => {
      const hintEncoded = this.hintToIndex.get(hint)!;
      const input = [...userFeatures, hintEncoded];

      let predicted: number;
      if (this.dtModel) {
        predicted = this.dtModel.predict(input);
      } else {
        predicted = this.lrModel!.predict(input)[0];
      }
      return { hint, score: predicted };
    });

    // Sort descending by predicted score
    scoredHints.sort((a, b) => b.score - a.score);

    // Return topK hints
    return scoredHints.slice(0, topK).map((item) => item.hint);
  }
}
