import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GameCategoriesService } from '../providers/game-categories.service';


@ApiTags('game-categories')
@Controller('game-categories')
export class GameCategoriesController {
  constructor(private readonly categoriesService: GameCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all game categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all game categories.',
  })
  findAll() {
    return this.categoriesService.findAll();
  }

    @Get(':id')
  @ApiOperation({ summary: 'Get a game category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the game category with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Game category not found.',
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

}
