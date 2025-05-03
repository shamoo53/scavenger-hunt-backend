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

    async findOne(id: number): Promise<GameCategory> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

    async findGamesByCategory(categoryId: number): Promise<Game[]> {
    const category = await this.findOne(categoryId);

    const games = await this.gamesRepository
      .createQueryBuilder('game')
      .innerJoin('game.categories', 'category', 'category.id = :categoryId', {
        categoryId,
      })
      .leftJoinAndSelect('game.categories', 'allCategories')
      .where('game.isActive = :isActive', { isActive: true })
      .orderBy('game.name', 'ASC')
      .getMany();

    return games;
  }

}
