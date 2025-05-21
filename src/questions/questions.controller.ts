import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import type { QuestionsService } from './questions.service';
import type { CreateQuestionDto } from './dto/create-question.dto';
import type { UpdateQuestionDto } from './dto/update-question.dto';
import type {
  Question,
  QuestionDifficulty,
  QuestionType,
} from './question.entity';
@Controller('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto): Promise<Question> {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll() {
    return this.questionsService.findAllQuestions();
  }

  @Get('random')
  getRandomQuestions(
    @Query('count') count?: number,
    @Query('difficulty') difficulty?: QuestionDifficulty,
    @Query('type') type?: QuestionType,
    @Query('category') category?: string,
  ): Promise<Question[]> {
    return this.questionsService.getRandomQuestions(
      count,
      difficulty,
      type,
      category,
    );
  }

  @Get('category/:category')
  getQuestionsByCategory(@Param('category') category: string) {
    return this.questionsService.getQuestionsByCategory(category);
  }

  @Get('difficulty/:difficulty')
  getQuestionsByDifficulty(
    @Param('difficulty') difficulty: QuestionDifficulty,
  ) {
    return this.questionsService.getQuestionsByDifficulty(difficulty);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Question> {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.questionsService.remove(id);
  }
}
