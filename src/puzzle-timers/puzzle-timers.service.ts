// src/puzzle-timers/puzzle-timers.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePuzzleTimerDto } from './dto/create-puzzle-timer.dto';
import { UpdatePuzzleTimerDto } from './dto/update-puzzle-timer.dto';
import { PuzzleTimer } from './entities/puzzle-timer.entity';

@Injectable()
export class PuzzleTimersService {
  constructor(
    @InjectRepository(PuzzleTimer)
    private readonly timerRepository: Repository<PuzzleTimer>,
  ) {}

  create(createPuzzleTimerDto: CreatePuzzleTimerDto): Promise<PuzzleTimer> {
    const timer = this.timerRepository.create({
      ...createPuzzleTimerDto,
      startTime: new Date(createPuzzleTimerDto.startTime),
      endTime: new Date(createPuzzleTimerDto.endTime),
    });
    return this.timerRepository.save(timer);
  }

  findAll(): Promise<PuzzleTimer[]> {
    return this.timerRepository.find();
  }

  async findOne(id: string): Promise<PuzzleTimer> {
    const timer = await this.timerRepository.findOneBy({ id });
    if (!timer) {
      throw new NotFoundException(`Timer with ID "${id}" not found`);
    }
    return timer;
  }

  async update(
    id: string,
    updatePuzzleTimerDto: UpdatePuzzleTimerDto,
  ): Promise<PuzzleTimer> {
    const timer = await this.timerRepository.preload({
      id,
      ...updatePuzzleTimerDto,
      // Ensure date strings are converted to Date objects if they exist
      ...(updatePuzzleTimerDto.startTime && {
        startTime: new Date(updatePuzzleTimerDto.startTime),
      }),
      ...(updatePuzzleTimerDto.endTime && {
        endTime: new Date(updatePuzzleTimerDto.endTime),
      }),
    });

    if (!timer) {
      throw new NotFoundException(`Timer with ID "${id}" not found`);
    }
    return this.timerRepository.save(timer);
  }

  async remove(id: string): Promise<{ id: string; message: string }> {
    const timer = await this.findOne(id);
    await this.timerRepository.remove(timer);
    return { id, message: 'Successfully deleted timer.' };
  }
}