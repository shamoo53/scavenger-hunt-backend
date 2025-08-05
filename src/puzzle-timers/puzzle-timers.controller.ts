// src/puzzle-timers/puzzle-timers.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PuzzleTimersService } from './puzzle-timers.service';
import { CreatePuzzleTimerDto } from './dto/create-puzzle-timer.dto';
import { UpdatePuzzleTimerDto } from './dto/update-puzzle-timer.dto';

@Controller('puzzle-timers')
export class PuzzleTimersController {
  constructor(private readonly puzzleTimersService: PuzzleTimersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPuzzleTimerDto: CreatePuzzleTimerDto) {
    return this.puzzleTimersService.create(createPuzzleTimerDto);
  }

  @Get()
  findAll() {
    return this.puzzleTimersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.puzzleTimersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePuzzleTimerDto: UpdatePuzzleTimerDto,
  ) {
    return this.puzzleTimersService.update(id, updatePuzzleTimerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.puzzleTimersService.remove(id);
  }
}