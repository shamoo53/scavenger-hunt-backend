import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
   ApiParam,
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

    @Get(':id')
  @ApiOperation({ summary: 'Get a game by ID' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the game with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Game not found.',
  })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(+id);
  }
}
