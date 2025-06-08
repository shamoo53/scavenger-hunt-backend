import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Contribution } from '../entities/contribution.entity';
import { User } from '../entities/user.entity';
import { CreateContributionDto } from '../dto/create-contribution.dto';
import { ReviewContributionDto } from '../dto/review-contribution.dto';
import { ContributionStatus } from '../enums/contribution-type.enum';
import { ReputationService } from './reputation.service';

@Injectable()
export class ContributionService {
  constructor(
    @InjectRepository(Contribution)
    private contributionRepository: Repository<Contribution>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private reputationService: ReputationService,
  ) {}

  async create(userId: number, createContributionDto: CreateContributionDto): Promise<Contribution> {
    const contribution = this.contributionRepository.create({
      ...createContributionDto,
      userId,
    });

    return this.contributionRepository.save(contribution);
  }

  async findUserContributions(userId: number): Promise<Contribution[]> {
    return this.contributionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingContributions(): Promise<Contribution[]> {
    return this.contributionRepository.find({
      where: { status: ContributionStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async reviewContribution(
    contributionId: number,
    reviewerId: number,
    reviewDto: ReviewContributionDto,
  ): Promise<Contribution> {
    const contribution = await this.contributionRepository.findOne({
      where: { id: contributionId },
      relations: ['user'],
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }

    if (contribution.status !== ContributionStatus.PENDING) {
      throw new ForbiddenException('Contribution has already been reviewed');
    }

    // Update contribution
    await this.contributionRepository.update(contributionId, {
      status: reviewDto.status,
      pointsAwarded: reviewDto.pointsAwarded,
      reviewedBy: reviewerId,
      reviewNotes: reviewDto.reviewNotes,
    });

    // Award points if approved
    if (reviewDto.status === ContributionStatus.APPROVED && reviewDto.pointsAwarded > 0) {
      await this.reputationService.awardPoints(
        contribution.userId,
        reviewDto.pointsAwarded,
        `Contribution approved: ${contribution.title}`,
        contributionId,
      );
    }

    return this.contributionRepository.findOne({
      where: { id: contributionId },
      relations: ['user'],
    });
  }

  async getContributionStats(userId?: number): Promise<any> {
    const whereClause = userId ? { userId } : {};
    
    const [total, pending, approved, rejected] = await Promise.all([
      this.contributionRepository.count({ where: whereClause }),
      this.contributionRepository.count({ 
        where: { ...whereClause, status: ContributionStatus.PENDING } 
      }),
      this.contributionRepository.count({ 
        where: { ...whereClause, status: ContributionStatus.APPROVED } 
      }),
      this.contributionRepository.count({ 
        where: { ...whereClause, status: ContributionStatus.REJECTED } 
      }),
    ]);

    return { total, pending, approved, rejected };
  }
}