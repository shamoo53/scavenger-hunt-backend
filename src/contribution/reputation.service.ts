import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ReputationHistory } from '../entities/reputation-history.entity';
import { Contribution } from '../entities/contribution.entity';
import { ContributionType } from '../enums/contribution-type.enum';

@Injectable()
export class ReputationService {
  // Point values for different contribution types
  private readonly POINT_VALUES = {
    [ContributionType.PUZZLE_CREATED]: 50,
    [ContributionType.BUG_REPORTED]: 25,
    [ContributionType.BUG_FIXED]: 100,
    [ContributionType.PUZZLE_REVIEWED]: 15,
    [ContributionType.COMMUNITY_HELP]: 10,
    [ContributionType.DOCUMENTATION]: 30,
  };

  // Level thresholds
  private readonly LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ReputationHistory)
    private reputationHistoryRepository: Repository<ReputationHistory>,
  ) {}

  getPointsForContribution(type: ContributionType): number {
    return this.POINT_VALUES[type] || 0;
  }

  async awardPoints(
    userId: number,
    points: number,
    reason: string,
    contributionId?: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const previousPoints = user.reputationPoints;
    const newPoints = previousPoints + points;
    const newLevel = this.calculateLevel(newPoints);

    // Update user points and level
    await this.userRepository.update(userId, {
      reputationPoints: newPoints,
      level: newLevel,
    });

    // Record history
    await this.reputationHistoryRepository.save({
      userId,
      contributionId,
      pointsChange: points,
      reason,
      previousPoints,
      newPoints,
    });
  }

  private calculateLevel(points: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  async getUserReputationHistory(userId: number): Promise<ReputationHistory[]> {
    return this.reputationHistoryRepository.find({
      where: { userId },
      relations: ['contribution'],
      order: { createdAt: 'DESC' },
    });
  }
}