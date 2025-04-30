import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Between, type FindOptionsWhere, type Repository } from "typeorm"
import { GameSession, GameSessionStatus } from "./game-session.entity"
import type { CreateGameSessionDto } from "./dto/create-game-session.dto"
import type { AnswerQuestionDto } from "./dto/answer-question.dto"
import type { GameSessionFilterDto } from "./dto/game-session-filter.dto"
import type { QuestionsService } from "../questions/questions.service"
import type { LeaderboardService } from "../leaderboard/leaderboard.service"
import type { PaginatedResult } from "../common/interfaces/paginated-result.interface"

@Injectable()
export class GameSessionService {
  constructor(
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    private readonly questionsService: QuestionsService,
    private readonly leaderboardService: LeaderboardService,
  ) { }

  asyncync
  create(createDto: CreateGameSessionDto): Promise<GameSession> {
    const { playerId, gameId, questionIds, region, platform, metadata } = createDto

    // If question IDs are not provided, generate random questions
    let finalQuestionIds = questionIds
    if (!finalQuestionIds || finalQuestionIds.length === 0) {
      const randomQuestions = await this.questionsService.getRandomQuestions(10)
      finalQuestionIds = randomQuestions.map((q) => q.id)
    }

    const session = this.gameSessionRepository.create({
      playerId,
      gameId,
      questionIds: finalQuestionIds,
      status: GameSessionStatus.ACTIVE,
      startTime: new Date(),
      region,
      platform,
      metadata,
    })

    return this.gameSessionRepository.save(session)
  }

  async findAll(filterDto: GameSessionFilterDto): Promise<PaginatedResult<GameSession>> {
    const { limit, offset, playerId, gameId, status, startDate, endDate, region, platform, sortBy, sortOrder } =
      filterDto

    const where: FindOptionsWhere<GameSession> = {}

    // Apply filters
    if (playerId) {
      where.playerId = playerId
    }

    if (gameId) {
      where.gameId = gameId
    }

    if (status) {
      where.status = status
    }

    if (region) {
      where.region = region
    }

    if (platform) {
      where.platform = platform
    }

    // Date range
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date())
    } else if (endDate) {
      where.createdAt = Between(new Date(0), new Date(endDate))
    }

    // Get total count
    const total = await this.gameSessionRepository.count({ where })

    // Get paginated data
    const data = await this.gameSessionRepository.find({
      where,
      order: { [sortBy || "createdAt"]: sortOrder || "DESC" },
      skip: offset,
      take: limit,
    })

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    }
  }

  async findOne(id: number): Promise<GameSession> {
    const session = await this.gameSessionRepository.findOne({ where: { id } })
    if (!session) {
      throw new NotFoundException(`Game session with ID ${id} not found`)
    }
    return session
  }

  async getCurrentQuestion(id: number): Promise<any> {
    const session = await this.findOne(id)

    if (session.status !== GameSessionStatus.ACTIVE) {
      throw new BadRequestException("This game session is not active")
    }

    if (session.currentQuestionIndex >= session.questionIds.length) {
      throw new BadRequestException("All questions have been answered")
    }

    const currentQuestionId = session.questionIds[session.currentQuestionIndex]
    const question = await this.questionsService.findOne(currentQuestionId)

    // Don't send the correct answer to the client
    const { correctAnswer, ...questionData } = question

    return {
      sessionId: session.id,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questionIds.length,
      question: questionData,
    }
  }

  async answerQuestion(id: number, answerDto: AnswerQuestionDto): Promise<any> {
    const session = await this.findOne(id)

    if (session.status !== GameSessionStatus.ACTIVE) {
      throw new BadRequestException("This game session is not active")
    }

    if (session.currentQuestionIndex >= session.questionIds.length) {
      throw new BadRequestException("All questions have been answered")
    }

    const currentQuestionId = session.questionIds[session.currentQuestionIndex]
    const question = await this.questionsService.findOne(currentQuestionId)

    // Check if the answer is correct
    const isCorrect = question.correctAnswer === answerDto.selectedAnswer

    // Calculate score based on correctness and time
    let pointsForQuestion = 0
    if (isCorrect) {
      // Base points for correct answer
      pointsForQuestion = 100

      // Bonus points for quick answers (max 50 bonus points)
      const timeBonus = Math.max(0, 50 - Math.floor(answerDto.timeToAnswerMs / 1000))
      pointsForQuestion += timeBonus

      // Difficulty multiplier
      if (question.difficulty === "medium") {
        pointsForQuestion *= 1.5
      } else if (question.difficulty === "hard") {
        pointsForQuestion *= 2
      }
    }

    // Record the answer
    session.answers.push({
      questionId: currentQuestionId,
      selectedAnswer: answerDto.selectedAnswer,
      isCorrect,
      timeToAnswerMs: answerDto.timeToAnswerMs,
    })

    // Update score
    session.score += pointsForQuestion

    // Move to the next question
    session.currentQuestionIndex += 1

    // Check if this was the last question
    const isLastQuestion = session.currentQuestionIndex >= session.questionIds.length
    if (isLastQuestion) {
      session.status = GameSessionStatus.COMPLETED
      session.endTime = new Date()
      session.totalTimeMs = session.endTime.getTime() - session.startTime.getTime()

      // Add to leaderboard
      await this.leaderboardService.create({
        playerName: session.playerId,
        score: session.score,
        gameId: session.gameId,
      })
    }

    // Save the updated session
    await this.gameSessionRepository.save(session)

    // Record feedback for the question
    await this.questionsService.recordFeedback(currentQuestionId, {
      wasCorrect: isCorrect,
      timeToAnswerMs: answerDto.timeToAnswerMs,
    })

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned: pointsForQuestion,
      totalScore: session.score,
      isLastQuestion,
      nextQuestionIndex: session.currentQuestionIndex,
    }
  }

  async abandonSession(id: number): Promise<GameSession> {
    const session = await this.findOne(id)

    if (session.status !== GameSessionStatus.ACTIVE) {
      throw new BadRequestException("This game session is not active")
    }

    session.status = GameSessionStatus.ABANDONED
    session.endTime = new Date()
    session.totalTimeMs = session.endTime.getTime() - session.startTime.getTime()

    return this.gameSessionRepository.save(session)
  }

  async getSessionResults(id: number): Promise<any> {
    const session = await this.findOne(id)

    if (session.status === GameSessionStatus.ACTIVE) {
      throw new BadRequestException("This game session is still active")
    }

    // Get all questions for this session
    const questionIds = session.questionIds
    const questions = await Promise.all(questionIds.map((id) => this.questionsService.findOne(id)))

    // Map questions to answers
    const questionsWithAnswers = questions.map((question, index) => {
      const answer = session.answers.find((a) => a.questionId === question.id)
      return {
        questionId: question.id,
        questionText: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: answer?.selectedAnswer || null,
        isCorrect: answer?.isCorrect || false,
        timeToAnswerMs: answer?.timeToAnswerMs || null,
      }
    })

    // Calculate statistics
    const totalQuestions = questionIds.length
    const answeredQuestions = session.answers.length
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length
    const incorrectAnswers = answeredQuestions - correctAnswers
    const correctPercentage = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0

    const averageTimePerQuestion =
      answeredQuestions > 0 ? session.answers.reduce((sum, a) => sum + a.timeToAnswerMs, 0) / answeredQuestions : 0

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameId: session.gameId,
      status: session.status,
      score: session.score,
      startTime: session.startTime,
      endTime: session.endTime,
      totalTimeMs: session.totalTimeMs,
      statistics: {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        incorrectAnswers,
        correctPercentage,
        averageTimePerQuestion,
      },
      questions: questionsWithAnswers,
    }
  }

  async getPlayerStats(playerId: string): Promise<any> {
    // Get all completed sessions for this player
    const sessions = await this.gameSessionRepository.find({
      where: {
        playerId,
        status: GameSessionStatus.COMPLETED,
      },
    })

    if (sessions.length === 0) {
      return {
        playerId,
        totalGames: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        totalTimePlayed: 0,
        correctAnswerRate: 0,
      }
    }

    // Calculate statistics
    const totalGames = sessions.length
    const totalScore = sessions.reduce((sum, s) => sum + s.score, 0)
    const averageScore = totalScore / totalGames
    const highestScore = Math.max(...sessions.map((s) => s.score))
    const totalTimePlayed = sessions.reduce((sum, s) => sum + s.totalTimeMs, 0)

    // Calculate correct answer rate across all sessions
    const allAnswers = sessions.flatMap((s) => s.answers)
    const totalAnswers = allAnswers.length
    const correctAnswers = allAnswers.filter((a) => a.isCorrect).length
    const correctAnswerRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

    // Get game distribution
    const gameDistribution = {}
    sessions.forEach((s) => {
      if (s.gameId) {
        gameDistribution[s.gameId] = (gameDistribution[s.gameId] || 0) + 1
      }
    })

    // Get recent games
    const recentGames = sessions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((s) => ({
        sessionId: s.id,
        gameId: s.gameId,
        score: s.score,
        date: s.createdAt,
        questionsAnswered: s.answers.length,
        correctAnswers: s.answers.filter((a) => a.isCorrect).length,
      }))

    return {
      playerId,
      totalGames,
      totalScore,
      averageScore,
      highestScore,
      totalTimePlayed,
      correctAnswerRate,
      gameDistribution,
      recentGames,
    }
  }

  async getGameStats(gameId: string): Promise<any> {
    // Get all completed sessions for this game
    const sessions = await this.gameSessionRepository.find({
      where: {
        gameId,
        status: GameSessionStatus.COMPLETED,
      },
    })

    if (sessions.length === 0) {
      return {
        gameId,
        totalSessions: 0,
        uniquePlayers: 0,
        averageScore: 0,
        highestScore: 0,
        averageCompletionTime: 0,
      }
    }

    // Calculate statistics
    const totalSessions = sessions.length
    const uniquePlayers = new Set(sessions.map((s) => s.playerId)).size
    const scores = sessions.map((s) => s.score)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalSessions
    const highestScore = Math.max(...scores)
    const averageCompletionTime = sessions.reduce((sum, s) => sum + s.totalTimeMs, 0) / totalSessions

    // Get top players
    const playerScores = {}
    sessions.forEach((s) => {
      if (!playerScores[s.playerId] || playerScores[s.playerId] < s.score) {
        playerScores[s.playerId] = s.score
      }
    })

    const topPlayers = Object.entries(playerScores)
      .sort(([, scoreA], [, scoreB]) => Number(scoreB) - Number(scoreA))
      .slice(0, 10)
      .map(([playerId, score]) => ({ playerId, score }))

    // Calculate question statistics
    const allQuestionIds = new Set(sessions.flatMap((s) => s.questionIds))
    const questionStats = {}

    sessions.forEach((session) => {
      session.answers.forEach((answer) => {
        if (!questionStats[answer.questionId]) {
          questionStats[answer.questionId] = {
            timesAnswered: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            totalTimeMs: 0,
          }
        }

        questionStats[answer.questionId].timesAnswered += 1
        if (answer.isCorrect) {
          questionStats[answer.questionId].correctAnswers += 1
        } else {
          questionStats[answer.questionId].incorrectAnswers += 1
        }
        questionStats[answer.questionId].totalTimeMs += answer.timeToAnswerMs
      })
    })

    // Calculate averages for each question
    Object.keys(questionStats).forEach((questionId) => {
      const stats = questionStats[questionId]
      stats.correctRate = stats.timesAnswered > 0 ? (stats.correctAnswers / stats.timesAnswered) * 100 : 0
      stats.averageTimeMs = stats.timesAnswered > 0 ? stats.totalTimeMs / stats.timesAnswered : 0
    })

    return {
      gameId,
      totalSessions,
      uniquePlayers,
      averageScore,
      highestScore,
      averageCompletionTime,
      topPlayers,
      questionStats,
    }
  }
}
