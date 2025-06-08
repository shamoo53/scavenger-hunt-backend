import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Cronjob } from './entities/cron-job.entity';

import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { UpdateCronJobDto } from './dto/update-cron-job.dto';

@Injectable()
export class CronJobService {
  
private readonly logger = new Logger(CronJobService.name);

  constructor(
    @InjectRepository(Cronjob)
    private CreateCronJobRepository: Repository<Cronjob>,
  ) {}

  async create(CreateCronJobDto: CreateCronJobDto): Promise<Cronjob> {
    const puzzle = this.CreateCronJobRepository.create({
      ...CreateCronJobDto,
      releaseDate: CreateCronJobDto.releaseDate ? new Date(CreateCronJobDto.releaseDate) : null,
    });
    return this.CreateCronJobRepository.save(puzzle);
  }

  async findAll(): Promise<Cronjob[]> {
    return this.CreateCronJobRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Cronjob[]> {
    return this.CreateCronJobRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Cronjob> {
    return this.CreateCronJobRepository.findOne({ where: { id } });
  }

  async update(id: number, updatePuzzleDto: UpdateCronJobDto): Promise<Cronjob> {
    const updateData = {
      ...UpdateCronJobDto,
      releaseDate: UpdateCronJobDto.releaseDate ? new Date(UpdateCronJobDto.releaseDate) : undefined,
    };
    
    await this.CreateCronJobRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.CreateCronJobRepository.delete(id);
  }

  // Cron job to activate puzzles - runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async activateScheduledPuzzles(): Promise<void> {
    const now = new Date();
    
    try {
      const puzzlesToActivate = await this.CreateCronJobRepository.find({
        where: {
          isActive: false,
          releaseDate: LessThanOrEqual(now),
        },
      });

      if (puzzlesToActivate.length > 0) {
        await this.CreateCronJobRepository.update(
          { isActive: false, releaseDate: LessThanOrEqual(now) },
          { isActive: true }
        );

        this.logger.log(`Activated ${puzzlesToActivate.length} puzzles at ${now.toISOString()}`);
        
        // Log each activated puzzle
        puzzlesToActivate.forEach(puzzle => {
          this.logger.log(`Activated puzzle: ${puzzle.title} (ID: ${puzzle.id})`);
        });
      }
    } catch (error) {
      this.logger.error('Error activating scheduled puzzles:', error);
    }
  }

  // Manual method to activate puzzles (for testing or manual triggers)
  async manualActivation(): Promise<{ activated: number; puzzles: Cronjob[] }> {
    const now = new Date();
    
    const puzzlesToActivate = await this.CreateCronJobRepository.find({
      where: {
        isActive: false,
        releaseDate: LessThanOrEqual(now),
      },
    });

    if (puzzlesToActivate.length > 0) {
      await this.CreateCronJobRepository.update(
        { isActive: false, releaseDate: LessThanOrEqual(now) },
        { isActive: true }
      );
    }

    return {
      activated: puzzlesToActivate.length,
      puzzles: puzzlesToActivate,
    };
  }

  // Get scheduled puzzles (inactive with future release dates)
  async getScheduledPuzzles(): Promise<Cronjob[]> {
    const now = new Date();
    return this.CreateCronJobRepository.find({
      where: {
        isActive: false,
        releaseDate: LessThanOrEqual(now),
      },
      order: { releaseDate: 'ASC' },
    });
  }
}

