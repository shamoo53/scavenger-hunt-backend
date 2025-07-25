import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress, ProgressStatus } from './entities/progress.entity';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ProgressQueryDto } from './dto/progress-query.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
  ) {}

  async create(userId: string, createProgressDto: CreateProgressDto): Promise<Progress> {
    // Check if progress already exists for this user and puzzle
    const existingProgress = await this.progressRepository.findOne({
      where: {
        userId,
        puzzleId: createProgressDto.puzzleId,
      },
    });

    if (existingProgress) {
      throw new ConflictException(
        'Progress already exists for this user and puzzle',
      );
    }

    const progress = this.progressRepository.create({
      userId,
      ...createProgressDto,
    });

    return this.progressRepository.save(progress);
  }

  async findAll(userId: string, query: ProgressQueryDto) {
    const { puzzleId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.progressRepository
      .createQueryBuilder('progress')
      .where('progress.userId = :userId', { userId })
      .leftJoinAndSelect('progress.user', 'user');

    if (puzzleId) {
      queryBuilder.andWhere('progress.puzzleId = :puzzleId', { puzzleId });
    }

    if (status) {
      queryBuilder.andWhere('progress.status = :status', { status });
    }

    const [items, total] = await queryBuilder
      .orderBy('progress.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, puzzleId: string): Promise<Progress> {
    const progress = await this.progressRepository.findOne({
      where: { userId, puzzleId },
      relations: ['user'],
    });

    if (!progress) {
      throw new NotFoundException('Progress not found');
    }

    return progress;
  }

  async update(
    userId: string,
    puzzleId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<Progress> {
    const progress = await this.findOne(userId, puzzleId);

    // Auto-set completedAt when status changes to completed
    if (
      updateProgressDto.status === ProgressStatus.COMPLETED &&
      progress.status !== ProgressStatus.COMPLETED
    ) {
      updateProgressDto.completedAt = new Date();
    }

    Object.assign(progress, updateProgressDto);
    return this.progressRepository.save(progress);
  }

  async incrementAttempts(userId: string, puzzleId: string): Promise<Progress> {
    const progress = await this.findOne(userId, puzzleId);
    progress.attempts += 1;
    return this.progressRepository.save(progress);
  }

  async getPlayerStats(userId: string) {
    const stats = await this.progressRepository
      .createQueryBuilder('progress')
      .select([
        'COUNT(*) as totalPuzzles',
        'COUNT(CASE WHEN progress.status = :completed THEN 1 END) as completedPuzzles',
        'COUNT(CASE WHEN progress.status = :inProgress THEN 1 END) as inProgressPuzzles',
        'COALESCE(SUM(progress.score), 0) as totalScore',
        'COALESCE(AVG(progress.score), 0) as averageScore',
        'COALESCE(SUM(progress.timeSpentSeconds), 0) as totalTimeSpent',
      ])
      .where('progress.userId = :userId', { userId })
      .setParameters({
        completed: ProgressStatus.COMPLETED,
        inProgress: ProgressStatus.IN_PROGRESS,
      })
      .getRawOne();

    return {
      totalPuzzles: parseInt(stats.totalPuzzles),
      completedPuzzles: parseInt(stats.completedPuzzles),
      inProgressPuzzles: parseInt(stats.inProgressPuzzles),
      totalScore: parseInt(stats.totalScore),
      averageScore: parseFloat(stats.averageScore),
      totalTimeSpent: parseInt(stats.totalTimeSpent),
      completionRate: stats.totalPuzzles > 0 
        ? (stats.completedPuzzles / stats.totalPuzzles) * 100 
        : 0,
    };
  }

  async getLeaderboard(limit: number = 10) {
    return this.progressRepository
      .createQueryBuilder('progress')
      .select([
        'progress.userId',
        'user.username',
        'user.email',
        'SUM(progress.score) as totalScore',
        'COUNT(CASE WHEN progress.status = :completed THEN 1 END) as completedPuzzles',
      ])
      .leftJoin('progress.user', 'user')
      .where('progress.status = :completed')
      .setParameter('completed', ProgressStatus.COMPLETED)
      .groupBy('progress.userId, user.username, user.email')
      .orderBy('totalScore', 'DESC')
      .addOrderBy('completedPuzzles', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async remove(userId: string, puzzleId: string): Promise<void> {
    const progress = await this.findOne(userId, puzzleId);
    await this.progressRepository.remove(progress);
  }
}