import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreatePuzzleDto } from '../dto/create-puzzle.dto';
import { UpdatePuzzleDto } from '../dto/update-puzzle.dto';
import { PuzzleService } from '../services/puzzle.service';

@Controller('puzzle')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Post()
  create(@Body() createPuzzleDto: CreatePuzzleDto) {
    return this.puzzleService.create(createPuzzleDto);
  }

  @Get()
  findAll() {
    return this.puzzleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.puzzleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePuzzleDto: UpdatePuzzleDto) {
    return this.puzzleService.update(+id, updatePuzzleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.puzzleService.remove(+id);
  }
}
