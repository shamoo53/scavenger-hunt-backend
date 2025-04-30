import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Between, type Repository } from "typeorm"
import { LeaderboardEntry } from "../leaderboard/leaderboard.entity"
import { Question } from "../questions/question.entity"
import { GameSession, GameSessionStatus } from "../game-session/game-session.entity"

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
  ) {}

  async getDashboardStats(): Promise<any> {
    const totalPlayers = await this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .select("COUNT(DISTINCT leaderboard.playerName)", "count")
      .getRawOne()

    const totalQuestions = await this.questionRepository.count()

    const totalGameSessions = await this.gameSessionRepository.count()

    const completedGameSessions = await this.gameSessionRepository.count({
      where: { status: GameSessionStatus.COMPLETED },
    })

    const abandonedGameSessions = await this.gameSessionRepository.count({
      where: { status: GameSessionStatus.ABANDONED },
    })

    const completionRate = totalGameSessions > 0 ? (completedGameSessions / totalGameSessions) * 100 : 0

    return {
      totalPlayers: Number.parseInt(totalPlayers.count),
      totalQuestions,
      totalGameSessions,
      completedGameSessions,
      abandonedGameSessions,
      completionRate,
    }
  }

  async getTimeSeriesData(startDate: Date, endDate: Date, interval: "day" | "week" | "month" = "day"): Promise<any> {
    // Get game sessions in date range
    const sessions = await this.gameSessionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      select: ["createdAt", "status", "score"],
    })

    // Get leaderboard entries in date range
    const leaderboardEntries = await this.leaderboardRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      select: ["createdAt", "score"],
    })

    // Format data by interval
    const formatDate = (date: Date) => {
      if (interval === "day") {
        return date.toISOString().split("T")[0]
      } else if (interval === "week") {
        const d = new Date(date)
        d.setDate(d.getDate() - d.getDay()) // Start of week (Sunday)
        return d.toISOString().split("T")[0]
      } else if (interval === "month") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }
    }

    // Group sessions by interval
    const sessionsByInterval = {}
    sessions.forEach((session) => {
      const intervalKey = formatDate(session.createdAt)
      if (!sessionsByInterval[intervalKey]) {
        sessionsByInterval[intervalKey] = {
          total: 0,
          completed: 0,
          abandoned: 0,
          averageScore: 0,
          totalScore: 0,
        }
      }

      sessionsByInterval[intervalKey].total += 1

      if (session.status === GameSessionStatus.COMPLETED) {
        sessionsByInterval[intervalKey].completed += 1
        sessionsByInterval[intervalKey].totalScore += session.score
      } else if (session.status === GameSessionStatus.ABANDONED) {
        sessionsByInterval[intervalKey].abandoned += 1
      }
    })

    // Calculate average scores
    Object.keys(sessionsByInterval).forEach((key) => {
      const data = sessionsByInterval[key]
      data.averageScore = data.completed > 0 ? data.totalScore / data.completed : 0
    })

    // Group leaderboard entries by interval
    const leaderboardByInterval = {}
    leaderboardEntries.forEach((entry) => {
      const intervalKey = formatDate(entry.createdAt)
      if (!leaderboardByInterval[intervalKey]) {
        leaderboardByInterval[intervalKey] = {
          entries: 0,
          totalScore: 0,
          averageScore: 0,
        }
      }

      leaderboardByInterval[intervalKey].entries += 1
      leaderboardByInterval[intervalKey].totalScore += entry.score
    })

    // Calculate average scores for leaderboard
    Object.keys(leaderboardByInterval).forEach((key) => {
      const data = leaderboardByInterval[key]
      data.averageScore = data.entries > 0 ? data.totalScore / data.entries : 0
    })

    // Combine into time series format
    const timeSeriesData = []
    const allIntervals = new Set([...Object.keys(sessionsByInterval), ...Object.keys(leaderboardByInterval)])

    Array.from(allIntervals)
      .sort()
      .forEach((interval) => {
        const sessionData = sessionsByInterval[interval] || {
          total: 0,
          completed: 0,
          abandoned: 0,
          averageScore: 0,
        }

        const leaderboardData = leaderboardByInterval[interval] || {
          entries: 0,
          averageScore: 0,
        }

        timeSeriesData.push({
          interval,
          gameSessions: sessionData.total,
          completedSessions: sessionData.completed,
          abandonedSessions: sessionData.abandoned,
          gameSessionAvgScore: sessionData.averageScore,
          leaderboardEntries: leaderboardData.entries,
          leaderboardAvgScore: leaderboardData.averageScore,
        })
      })

    return timeSeriesData
  }

  async getQuestionPerformanceStats(): Promise<any> {
    // Get all questions with their stats
    const questions = await this.questionRepository.find({
      select: [
        "id",
        "text",
        "difficulty",
        "type",
        "category",
        "timesUsed",
        "correctAnswers",
        "incorrectAnswers",
        "averageTimeToAnswer",
      ],
    })

    // Calculate performance metrics
    const questionStats = questions.map((question) => {
      const totalAnswers = question.correctAnswers + question.incorrectAnswers
      const correctRate = totalAnswers > 0 ? (question.correctAnswers / totalAnswers) * 100 : 0

      return {
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        type: question.type,
        category: question.category,
        timesUsed: question.timesUsed,
        correctRate,
        averageTimeToAnswer: question.averageTimeToAnswer,
      }
    })

    // Sort by different metrics
    const mostUsed = [...questionStats].sort((a, b) => b.timesUsed - a.timesUsed).slice(0, 10)
    const hardest = [...questionStats]
      .filter((q) => q.timesUsed > 0)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 10)
    const easiest = [...questionStats]
      .filter((q) => q.timesUsed > 0)
      .sort((a, b) => b.correctRate - a.correctRate)
      .slice(0, 10)
    const slowest = [...questionStats]
      .filter((q) => q.timesUsed > 0)
      .sort((a, b) => b.averageTimeToAnswer - a.averageTimeToAnswer)
      .slice(0, 10)

    // Difficulty distribution
    const difficultyStats = {
      easy: { count: 0, avgCorrectRate: 0, totalCorrectRate: 0 },
      medium: { count: 0, avgCorrectRate: 0, totalCorrectRate: 0 },
      hard: { count: 0, avgCorrectRate: 0, totalCorrectRate: 0 },
    }

    questionStats.forEach((q) => {
      if (q.timesUsed > 0) {
        difficultyStats[q.difficulty].count += 1
        difficultyStats[q.difficulty].totalCorrectRate += q.correctRate
      }
    })

    Object.keys(difficultyStats).forEach((difficulty) => {
      const stats = difficultyStats[difficulty]
      stats.avgCorrectRate = stats.count > 0 ? stats.totalCorrectRate / stats.count : 0
    })

    return {
      mostUsed,
      hardest,
      easiest,
      slowest,
      difficultyStats,
    }
  }

  async getPlayerEngagementStats(): Promise<any> {
    // Get all game sessions
    const sessions = await this.gameSessionRepository.find({
      select: ["playerId", "status", "createdAt", "totalTimeMs"],
    })

    // Group by player
    const playerStats = {}
    sessions.forEach((session) => {
      if (!playerStats[session.playerId]) {
        playerStats[session.playerId] = {
          totalSessions: 0,
          completedSessions: 0,
          abandonedSessions: 0,
          totalTimeMs: 0,
          firstSession: session.createdAt,
          lastSession: session.createdAt,
        }
      }

      const stats = playerStats[session.playerId]
      stats.totalSessions += 1

      if (session.status === GameSessionStatus.COMPLETED) {
        stats.completedSessions += 1
      } else if (session.status === GameSessionStatus.ABANDONED) {
        stats.abandonedSessions += 1
      }

      if (session.totalTimeMs) {
        stats.totalTimeMs += session.totalTimeMs
      }

      if (session.createdAt < stats.firstSession) {
        stats.firstSession = session.createdAt
      }

      if (session.createdAt > stats.lastSession) {
        stats.lastSession = session.createdAt
      }
    })

    // Calculate engagement metrics
    const playerEngagement = Object.entries(playerStats).map(([playerId, stats]) => {
      const completionRate = stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0

      const daysSinceFirstSession = Math.floor(
        (new Date().getTime() - new Date(stats.firstSession).getTime()) / (1000 * 60 * 60 * 24),
      )

      const daysSinceLastSession = Math.floor(
        (new Date().getTime() - new Date(stats.lastSession).getTime()) / (1000 * 60 * 60 * 24),
      )

      const averageSessionTimeMs = stats.completedSessions > 0 ? stats.totalTimeMs / stats.completedSessions : 0

      return {
        playerId,
        totalSessions: stats.totalSessions,
        completedSessions: stats.completedSessions,
        abandonedSessions: stats.abandonedSessions,
        completionRate,
        averageSessionTimeMs,
        totalTimeMs: stats.totalTimeMs,
        daysSinceFirstSession,
        daysSinceLastSession,
        isReturningPlayer: stats.totalSessions > 1,
        isActivePlayer: daysSinceLastSession <= 7,
      }
    })

    // Calculate overall metrics
    const totalPlayers = playerEngagement.length
    const activePlayers = playerEngagement.filter((p) => p.isActivePlayer).length
    const returningPlayers = playerEngagement.filter((p) => p.isReturningPlayer).length
    const averageCompletionRate = playerEngagement.reduce((sum, p) => sum + p.completionRate, 0) / totalPlayers
    const averageSessionTime = playerEngagement.reduce((sum, p) => sum + p.averageSessionTimeMs, 0) / totalPlayers

    // Most engaged players (by total time)
    const mostEngagedPlayers = [...playerEngagement].sort((a, b) => b.totalTimeMs - a.totalTimeMs).slice(0, 10)

    // Most active players (by session count)
    const mostActivePlayers = [...playerEngagement].sort((a, b) => b.totalSessions - a.totalSessions).slice(0, 10)

    return {
      totalPlayers,
      activePlayers,
      returningPlayers,
      activePlayerPercentage: (activePlayers / totalPlayers) * 100,
      returningPlayerPercentage: (returningPlayers / totalPlayers) * 100,
      averageCompletionRate,
      averageSessionTime,
      mostEngagedPlayers,
      mostActivePlayers,
    }
  }
}
