import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
  Not,
  IsNull,
} from 'typeorm';
import {
  Question,
  type QuestionDifficulty,
  type QuestionType,
} from './question.entity';
import type { CreateQuestionDto } from './dto/create-question.dto';
import type { UpdateQuestionDto } from './dto/update-question.dto';
import type { QuestionsFilterDto } from './dto/questions-filter.dto';
import type { QuestionFeedbackDto } from './dto/question-feedback.dto';
import type { ImportQuestionsDto } from './dto/import-questions.dto';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async findAll(
    filterDto: QuestionsFilterDto,
  ): Promise<PaginatedResult<Question>> {
    const {
      limit,
      offset,
      search,
      difficulty,
      type,
      category,
      tags,
      isActive,
      minUsage,
      maxUsage,
      authorId,
      version,
      sortBy,
      sortOrder,
    } = filterDto;

    const where: FindOptionsWhere<Question> = {};

    // Apply filters
    if (search) {
      where.text = ILike(`%${search}%`);
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      // This is a simplified approach - for production, consider using a more sophisticated tags query
      where.tags = In(tags);
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (minUsage !== undefined && maxUsage !== undefined) {
      where.timesUsed = Between(minUsage, maxUsage);
    } else if (minUsage !== undefined) {
      where.timesUsed = MoreThanOrEqual(minUsage);
    } else if (maxUsage !== undefined) {
      where.timesUsed = LessThanOrEqual(maxUsage);
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (version) {
      where.version = version;
    }

    // Get total count
    const total = await this.questionsRepository.count({ where });

    // Get paginated data
    const data = await this.questionsRepository.find({
      where,
      order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    };
  }

  async findOne(id: number): Promise<Question> {
    const question = await this.questionsRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async create(createDto: CreateQuestionDto): Promise<Question> {
    const newQuestion = this.questionsRepository.create(createDto);
    return this.questionsRepository.save(newQuestion);
  }

  async update(id: number, updateDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(id);

    // If we're updating a question, create a new version
    if (
      Object.keys(updateDto).some((key) =>
        ['text', 'options', 'correctAnswer'].includes(key),
      )
    ) {
      // Create a new version
      const newVersion = this.questionsRepository.create({
        ...question,
        ...updateDto,
        id: null, // Let the database assign a new ID
        previousVersionId: question.id,
        version: question.version + 1,
        timesUsed: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
      });

      // Mark the old version as inactive
      question.isActive = false;
      await this.questionsRepository.save(question);

      // Save and return the new version
      return this.questionsRepository.save(newVersion);
    }

    // For minor updates that don't require versioning
    const updated = Object.assign(question, updateDto);
    return this.questionsRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const question = await this.findOne(id);
    await this.questionsRepository.remove(question);
  }

  async getRandomQuestions(
    count = 5,
    difficulty?: QuestionDifficulty,
    type?: QuestionType,
    category?: string,
    excludeIds: number[] = [],
  ): Promise<Question[]> {
    const query = this.questionsRepository
      .createQueryBuilder('question')
      .where('question.isActive = :isActive', { isActive: true });

    if (difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    if (type) {
      query.andWhere('question.type = :type', { type });
    }

    if (category) {
      query.andWhere('question.category = :category', { category });
    }

    if (excludeIds.length > 0) {
      query.andWhere('question.id NOT IN (:...excludeIds)', { excludeIds });
    }

    const questions = await query.orderBy('RANDOM()').take(count).getMany();

    // Update the timesUsed counter for each question
    for (const question of questions) {
      question.timesUsed += 1;
      await this.questionsRepository.save(question);
    }

    return questions;
  }

  async getQuestionsByCategory(
    category: string,
    filterDto?: QuestionsFilterDto,
  ): Promise<PaginatedResult<Question>> {
    return this.findAll({
      ...filterDto,
      category,
    });
  }

  async findAllQuestions() {
    return 'All questions';
  }

  async getQuestionsByDifficulty(
    difficulty: QuestionDifficulty,
    filterDto?: QuestionsFilterDto,
  ): Promise<PaginatedResult<Question>> {
    return this.findAll({
      ...filterDto,
      difficulty,
    });
  }

  async getQuestionsByTags(
    tags: string[],
    filterDto: QuestionsFilterDto,
  ): Promise<PaginatedResult<Question>> {
    return this.findAll({
      ...filterDto,
      tags,
    });
  }

  async recordFeedback(
    id: number,
    feedbackDto: QuestionFeedbackDto,
  ): Promise<Question> {
    const question = await this.findOne(id);

    // Update answer statistics
    if (feedbackDto.wasCorrect) {
      question.correctAnswers += 1;
    } else {
      question.incorrectAnswers += 1;
    }

    // Update average time to answer
    const totalAnswers = question.correctAnswers + question.incorrectAnswers;
    const currentTotalTime = question.averageTimeToAnswer * (totalAnswers - 1);
    question.averageTimeToAnswer =
      (currentTotalTime + feedbackDto.timeToAnswerMs) / totalAnswers;

    // Update likes/dislikes if provided
    if (feedbackDto.liked !== undefined) {
      if (feedbackDto.liked) {
        question.likes += 1;
      } else {
        question.dislikes += 1;
      }
    }

    return this.questionsRepository.save(question);
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.questionsRepository
      .createQueryBuilder('question')
      .select('DISTINCT question.category')
      .where('question.category IS NOT NULL')
      .getRawMany();

    return categories.map((c) => c.category);
  }

  async getTags(): Promise<string[]> {
    const questions = await this.questionsRepository.find({
      select: ['tags'],
      where: { tags: Not(IsNull()) },
    });

    const allTags = questions.flatMap((q) => q.tags || []);
    return [...new Set(allTags)];
  }

  async importQuestions(
    importDto: ImportQuestionsDto,
  ): Promise<{ total: number; created: number }> {
    const { questions } = importDto;
    let created = 0;

    for (const questionDto of questions) {
      try {
        await this.create(questionDto);
        created++;
      } catch (error) {
        console.error(`Failed to import question: ${error.message}`);
      }
    }

    return {
      total: questions.length,
      created,
    };
  }

  async exportQuestions(filterDto: QuestionsFilterDto): Promise<Question[]> {
    const { data } = await this.findAll(filterDto);
    return data;
  }

  async getQuestionVersions(id: number): Promise<Question[]> {
    // Get the current question
    const currentQuestion = await this.findOne(id);

    // Find all versions of this question
    const versions = await this.questionsRepository.find({
      where: [{ id }, { previousVersionId: id }],
      order: { version: 'DESC' },
    });

    // If this is already a version of another question, find the original and all its versions
    if (currentQuestion.previousVersionId) {
      const originalAndOtherVersions = await this.questionsRepository.find({
        where: [
          { id: currentQuestion.previousVersionId },
          { previousVersionId: currentQuestion.previousVersionId },
        ],
        order: { version: 'DESC' },
      });

      // Combine and deduplicate
      const allVersions = [...versions, ...originalAndOtherVersions];
      const uniqueVersions = allVersions.filter(
        (v, i, self) => i === self.findIndex((t) => t.id === v.id),
      );

      return uniqueVersions.sort((a, b) => b.version - a.version);
    }

    return versions;
  }

  async getQuestionStats(id: number): Promise<any> {
    const question = await this.findOne(id);

    const totalAnswers = question.correctAnswers + question.incorrectAnswers;
    const correctPercentage =
      totalAnswers > 0 ? (question.correctAnswers / totalAnswers) * 100 : 0;

    return {
      id: question.id,
      text: question.text,
      timesUsed: question.timesUsed,
      totalAnswers,
      correctAnswers: question.correctAnswers,
      incorrectAnswers: question.incorrectAnswers,
      correctPercentage,
      averageTimeToAnswer: question.averageTimeToAnswer,
      likes: question.likes,
      dislikes: question.dislikes,
      difficulty: question.difficulty,
      type: question.type,
      category: question.category,
      tags: question.tags,
      version: question.version,
      createdAt: question.createdAt,
    };
  }

  async getQuestionsStats(filterDto: QuestionsFilterDto): Promise<any> {
    const { data } = await this.findAll(filterDto);

    if (data.length === 0) {
      return {
        totalQuestions: 0,
        averageCorrectPercentage: 0,
        averageTimeToAnswer: 0,
        mostUsedQuestion: null,
        leastUsedQuestion: null,
      };
    }

    const totalQuestions = data.length;
    let totalCorrectPercentage = 0;
    let totalAverageTime = 0;
    let mostUsedQuestion = data[0];
    let leastUsedQuestion = data[0];

    for (const question of data) {
      const totalAnswers = question.correctAnswers + question.incorrectAnswers;
      const correctPercentage =
        totalAnswers > 0 ? (question.correctAnswers / totalAnswers) * 100 : 0;

      totalCorrectPercentage += correctPercentage;
      totalAverageTime += question.averageTimeToAnswer;

      if (question.timesUsed > mostUsedQuestion.timesUsed) {
        mostUsedQuestion = question;
      }

      if (question.timesUsed < leastUsedQuestion.timesUsed) {
        leastUsedQuestion = question;
      }
    }

    return {
      totalQuestions,
      averageCorrectPercentage: totalCorrectPercentage / totalQuestions,
      averageTimeToAnswer: totalAverageTime / totalQuestions,
      mostUsedQuestion: {
        id: mostUsedQuestion.id,
        text: mostUsedQuestion.text,
        timesUsed: mostUsedQuestion.timesUsed,
      },
      leastUsedQuestion: {
        id: leastUsedQuestion.id,
        text: leastUsedQuestion.text,
        timesUsed: leastUsedQuestion.timesUsed,
      },
      difficultyDistribution: this.calculateDifficultyDistribution(data),
      typeDistribution: this.calculateTypeDistribution(data),
      categoryDistribution: this.calculateCategoryDistribution(data),
    };
  }

  private calculateDifficultyDistribution(
    questions: Question[],
  ): Record<QuestionDifficulty, number> {
    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    questions.forEach((q) => {
      distribution[q.difficulty]++;
    });

    return distribution;
  }

  private calculateTypeDistribution(
    questions: Question[],
  ): Record<QuestionType, number> {
    const distribution = {
      multiple_choice: 0,
      true_false: 0,
      open_ended: 0,
    };

    questions.forEach((q) => {
      distribution[q.type]++;
    });

    return distribution;
  }

  private calculateCategoryDistribution(
    questions: Question[],
  ): Record<string, number> {
    const distribution = {};

    questions.forEach((q) => {
      if (q.category) {
        distribution[q.category] = (distribution[q.category] || 0) + 1;
      }
    });

    return distribution;
  }
}
