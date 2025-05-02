import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameCategory } from '../entities/game-category.entity';
import { Game } from '../entities/game.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class GameCategoriesService {
  constructor(
    @InjectRepository(GameCategory)
    private readonly categoriesRepository: Repository<GameCategory>,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<GameCategory[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

}
