import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTriviaDto } from './dto/create-trivia.dto';
import { UpdateTriviaDto } from './dto/update-trivia.dto';
import { TriviaCard } from './entities/trivia.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TriviaService {
  constructor(
    @InjectRepository(TriviaCard)
    private triviaRepo: Repository<TriviaCard>,
  ) {}

  create(dto: CreateTriviaDto) {
    const card = this.triviaRepo.create(dto);
    return this.triviaRepo.save(card);
  }

  findAll() {
    return this.triviaRepo.find();
  }

  findOne(id: string) {
    return this.triviaRepo.findOneBy({ id });
  }

  async update(id: string, dto: UpdateTriviaDto) {
    const card = await this.triviaRepo.preload({ id, ...dto });
    if (!card) throw new NotFoundException(`Card ${id} not found`);
    return this.triviaRepo.save(card);
  }

  async remove(id: string) {
    const card = await this.triviaRepo.findOneBy({ id });
    if (!card) throw new NotFoundException(`Card ${id} not found`);
    return this.triviaRepo.remove(card);
  }
}
