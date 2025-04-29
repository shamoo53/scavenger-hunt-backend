import {
  Controller,
  Get,
  HttpStatus,
  Query,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GamesService } from '../providers/games.service';
import { GameFilterDto } from '../dto/game-filter.dto';


@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all games with optional filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all games that match the filter criteria.',
  })
  findAll(@Query() filterDto: GameFilterDto) {
    return this.gamesService.findAll(filterDto);
  }

    @Get('featured')
  @ApiOperation({ summary: 'Get featured games' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all featured games.',
  })
  findFeatured() {
    return this.gamesService.findFeatured();
  }
}
