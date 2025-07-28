import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Season } from './entities/season.entity';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Injectable()
export class SeasonsService {
  constructor(
    @InjectRepository(Season)
    private seasonRepo: Repository<Season>,
  ) {}

  async create(dto: CreateSeasonDto) {
    const season = this.seasonRepo.create(dto);
    return this.seasonRepo.save(season);
  }

  findAll() {
    return this.seasonRepo.find({ order: { startDate: 'DESC' } });
  }

  findOne(id: string) {
    return this.seasonRepo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateSeasonDto) {
    const season = await this.seasonRepo.preload({ id, ...dto });
    if (!season) throw new NotFoundException('Season not found');
    return this.seasonRepo.save(season);
  }

  async remove(id: string) {
    const season = await this.findOne(id);
    if (!season) throw new NotFoundException('Season not found');
    return this.seasonRepo.remove(season);
  }

  async getCurrentSeason(): Promise<Season | null> {
    const now = new Date();
    return this.seasonRepo.findOne({
      where: {
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { startDate: 'DESC' },
    });
  }
}
