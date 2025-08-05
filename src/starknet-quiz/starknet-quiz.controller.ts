// src/starknet-quiz/starknet-quiz.controller.ts

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
import { StarknetQuizService } from './starknet-quiz.service';
import { CreateStarknetQuizDto } from './dto/create-starknet-quiz.dto';
import { UpdateStarknetQuizDto } from './dto/update-starknet-quiz.dto';

@Controller('starknet-quiz')
export class StarknetQuizController {
  constructor(private readonly quizService: StarknetQuizService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createQuizDto: CreateStarknetQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateQuizDto: UpdateStarknetQuizDto,
  ) {
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizService.remove(id);
  }
}