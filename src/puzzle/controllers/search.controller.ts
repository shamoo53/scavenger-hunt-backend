import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchPuzzleDto } from '../dto/search-puzzle.dto';
import { SearchResultDto } from '../dto/search-result.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('puzzles')
  async searchPuzzles(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchPuzzleDto,
  ): Promise<SearchResultDto> {
    return this.searchService.searchPuzzles(searchDto);
  }

  @Get('suggestions')
  async getSearchSuggestions(@Query('q') query: string): Promise<string[]> {
    return this.searchService.getSearchSuggestions(query);
  }

  @Get('popular-tags')
  async getPopularTags(
    @Query('limit') limit?: number,
  ): Promise<{ tag: string; count: number }[]> {
    return this.searchService.getPopularTags(limit || 20);
  }
}
