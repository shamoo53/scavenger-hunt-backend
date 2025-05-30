import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { SearchPuzzleDto } from '../dto/search-puzzle.dto';
import { SearchResultDto } from '../dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
  ) {}

  async searchPuzzles(searchDto: SearchPuzzleDto): Promise<SearchResultDto> {
    const { query, difficulty, tags, page, limit, sortBy, sortOrder } =
      searchDto;

    let queryBuilder = this.puzzleRepository
      .createQueryBuilder('puzzle')
      .select([
        'puzzle.id',
        'puzzle.title',
        'puzzle.clues',
        'puzzle.tags',
        'puzzle.difficulty',
        'puzzle.createdAt',
        'puzzle.updatedAt',
      ]);

    // Full-text search
    if (query && query.trim()) {
      const searchQuery = query
        .split(' ')
        .filter((term) => term.length > 0)
        .map((term) => `${term}:*`)
        .join(' & ');

      queryBuilder = queryBuilder
        .addSelect(
          'ts_rank(puzzle.search_vector, plainto_tsquery(:searchQuery))',
          'rank',
        )
        .where('puzzle.search_vector @@ plainto_tsquery(:searchQuery)', {
          searchQuery,
        })
        .setParameter('searchQuery', query);
    }

    // Filter by difficulty
    if (difficulty) {
      queryBuilder = queryBuilder.andWhere('puzzle.difficulty = :difficulty', {
        difficulty,
      });
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.andWhere('puzzle.tags && :tags', { tags });
    }

    // Apply sorting
    if (sortBy === 'relevance' && query) {
      queryBuilder = queryBuilder.orderBy('rank', sortOrder);
    } else if (sortBy === 'date') {
      queryBuilder = queryBuilder.orderBy('puzzle.createdAt', sortOrder);
    } else if (sortBy === 'title') {
      queryBuilder = queryBuilder.orderBy('puzzle.title', sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy('puzzle.createdAt', 'DESC');
    }

    // Pagination
    const offset = (page - 1) * limit;
    const [data, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results = await this.puzzleRepository
      .createQueryBuilder('puzzle')
      .select('DISTINCT unnest(puzzle.tags)', 'tag')
      .where('LOWER(unnest(puzzle.tags)) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .limit(10)
      .getRawMany();

    return results.map((result) => result.tag);
  }

  async getPopularTags(
    limit: number = 20,
  ): Promise<{ tag: string; count: number }[]> {
    const results = await this.puzzleRepository
      .createQueryBuilder('puzzle')
      .select('unnest(puzzle.tags)', 'tag')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tag')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result) => ({
      tag: result.tag,
      count: parseInt(result.count, 10),
    }));
  }
}
