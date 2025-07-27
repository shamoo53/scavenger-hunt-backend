import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { CreateTriviaDto } from './dto/create-trivia.dto';
import { UpdateTriviaDto } from './dto/update-trivia.dto';

@Controller('trivia')
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post()
  create(@Body() dto: CreateTriviaDto) {
    return this.triviaService.create(dto);
  }

  @Get()
  findAll() {
    return this.triviaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triviaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTriviaDto) {
    return this.triviaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.triviaService.remove(id);
  }
}
