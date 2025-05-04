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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateCategoryDto } from '../dto/create-category.dto';

@ApiTags('game-categories')
@Controller('game-categories')
export class GameCategoriesController {
  constructor(private readonly categoriesService: GameCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new game category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The game category has been successfully created.',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

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

    @Get(':id/games')
  @ApiOperation({ summary: 'Get games by category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all games in the specified category.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Game category not found.',
  })
  findGamesByCategory(@Param('id') id: string) {
    return this.categoriesService.findGamesByCategory(+id);
  }

}
