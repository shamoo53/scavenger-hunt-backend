import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AbuseRecord, UserAbuseStats } from './entities/abuse-record.entity';
import { AttemptRecord, AbuseDetectionConfig } from './interfaces/abuse-detection.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class AbuseDetectionService {
  private readonly logger = new Logger(AbuseDetectionService.name);
  
  private readonly config: AbuseDetectionConfig = {
    maxAttemptsPerMinute: 10,
    maxWrongAnswersInRow: 5,
    blockDurationMinutes: 30,
    adminFlagThreshold: 3
  };

  constructor(
    @InjectRepository(AbuseRecord)
    private abuseRecordRepository: Repository<AbuseRecord>,
    @InjectRepository(UserAbuseStats)
    private userStatsRepository: Repository<UserAbuseStats>,
  ) {}

  async recordAttempt(submitAnswerDto: SubmitAnswerDto): Promise<{ blocked: boolean; message?: string }> {
    const { userId, questionId, isCorrect, ipAddress } = submitAnswerDto;

    // Check if user is currently blocked
    const userStats = await this.getUserStats(userId);
    if (userStats.isBlocked && userStats.blockExpiresAt > new Date()) {
      return {
        blocked: true,
        message: `Access blocked until ${userStats.blockExpiresAt.toISOString()}`
      };
    }

    // Record the attempt
    const attemptRecord = this.abuseRecordRepository.create({
      userId,
      questionId,
      isCorrect,
      ipAddress,
      timestamp: new Date()
    });
    await this.abuseRecordRepository.save(attemptRecord);

    // Update user stats
    await this.updateUserStats(userId, isCorrect);

    // Check for abuse patterns
    const abuseDetected = await this.detectAbuse(userId);
    
    if (abuseDetected.shouldBlock) {
      await this.blockUser(userId, abuseDetected.reason);
      return {
        blocked: true,
        message: `Access temporarily blocked: ${abuseDetected.reason}`
      };
    }

    return { blocked: false };
  }

  private async getUserStats(userId: string): Promise<UserAbuseStats> {
    let userStats = await this.userStatsRepository.findOne({ where: { userId } });
    
    if (!userStats) {
      userStats = this.userStatsRepository.create({
        userId,
        totalAttempts: 0,
        wrongAttempts: 0,
        consecutiveWrongAttempts: 0,
        isBlocked: false,
        flaggedForAdmin: false
      });
      await this.userStatsRepository.save(userStats);
    }

    return userStats;
  }

  private async updateUserStats(userId: string, isCorrect: boolean): Promise<void> {
    const userStats = await this.getUserStats(userId);
    
    userStats.totalAttempts++;
    userStats.lastAttemptTime = new Date();
    userStats.updatedAt = new Date();

    if (!isCorrect) {
      userStats.wrongAttempts++;
      userStats.consecutiveWrongAttempts++;
    } else {
      userStats.consecutiveWrongAttempts = 0;
    }

    // Clear expired blocks
    if (userStats.isBlocked && userStats.blockExpiresAt <= new Date()) {
      userStats.isBlocked = false;
      userStats.blockExpiresAt = null;
    }

    await this.userStatsRepository.save(userStats);
  }

  private async detectAbuse(userId: string): Promise<{ shouldBlock: boolean; reason?: string }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    // Check rapid submissions
    const recentAttempts = await this.abuseRecordRepository.count({
      where: {
        userId,
        timestamp: MoreThan(oneMinuteAgo)
      }
    });

    if (recentAttempts >= this.config.maxAttemptsPerMinute) {
      this.logger.warn(`Rapid submission detected for user ${userId}: ${recentAttempts} attempts in 1 minute`);
      return {
        shouldBlock: true,
        reason: `Too many attempts: ${recentAttempts} submissions in 1 minute`
      };
    }

    // Check consecutive wrong answers
    const userStats = await this.getUserStats(userId);
    if (userStats.consecutiveWrongAttempts >= this.config.maxWrongAnswersInRow) {
      this.logger.warn(`Repeated wrong answers detected for user ${userId}: ${userStats.consecutiveWrongAttempts} consecutive wrong answers`);
      return {
        shouldBlock: true,
        reason: `Too many wrong answers: ${userStats.consecutiveWrongAttempts} consecutive incorrect attempts`
      };
    }

    return { shouldBlock: false };
  }

  private async blockUser(userId: string, reason: string): Promise<void> {
    const userStats = await this.getUserStats(userId);
    const blockExpiresAt = new Date();
    blockExpiresAt.setMinutes(blockExpiresAt.getMinutes() + this.config.blockDurationMinutes);

    userStats.isBlocked = true;
    userStats.blockExpiresAt = blockExpiresAt;
    userStats.updatedAt = new Date();

    // Flag for admin if this is a repeat offense
    const blockCount = await this.abuseRecordRepository.count({
      where: { userId }
    });

    if (blockCount >= this.config.adminFlagThreshold && !userStats.flaggedForAdmin) {
      userStats.flaggedForAdmin = true;
      userStats.flaggedAt = new Date();
      this.logger.warn(`User ${userId} flagged for admin review: ${reason}`);
    }

    await this.userStatsRepository.save(userStats);
    this.logger.log(`User ${userId} blocked until ${blockExpiresAt.toISOString()}: ${reason}`);
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const userStats = await this.getUserStats(userId);
    return userStats.isBlocked && userStats.blockExpiresAt > new Date();
  }

  async unblockUser(userId: string): Promise<void> {
    const userStats = await this.getUserStats(userId);
    userStats.isBlocked = false;
    userStats.blockExpiresAt = null;
    userStats.updatedAt = new Date();
    await this.userStatsRepository.save(userStats);
    this.logger.log(`User ${userId} manually unblocked`);
  }

  async getFlaggedUsers(): Promise<UserAbuseStats[]> {
    return this.userStatsRepository.find({
      where: { flaggedForAdmin: true },
      order: { flaggedAt: 'DESC' }
    });
  }

  async getUserAbuseStats(userId: string): Promise<UserAbuseStats> {
    return this.getUserStats(userId);
  }

  async clearUserFlag(userId: string): Promise<void> {
    const userStats = await this.getUserStats(userId);
    userStats.flaggedForAdmin = false;
    userStats.flaggedAt = null;
    userStats.updatedAt = new Date();
    await this.userStatsRepository.save(userStats);
  }
}