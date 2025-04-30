import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Between, type FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, type Repository } from "typeorm"
import { LeaderboardEntry } from "./leaderboard.entity"
import type { CreateLeaderboardEntryDto } from "./dto/create-leaderboard-entry.dto"
import type { UpdateLeaderboardEntryDto } from "./dto/update-leaderboard-entry.dto"
import { type LeaderboardFilterDto, TimeFrame } from "./dto/leaderboard-filter.dto"
import type { LeaderboardStatsDto } from "./dto/leaderboard-stats.dto"
import type { PaginatedResult } from "../common/interfaces/paginated-result.interface"

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
  ) { }

  async findAll(filterDto: LeaderboardFilterDto): Promise<PaginatedResult<LeaderboardEntry>> {
    const {
      limit,
      offset,
      playerName,
      gameId,
      region,
      platform,
      minScore,
      maxScore,
      startDate,
      endDate,
      timeFrame,
      sortBy,
      sortOrder,
    } = filterDto

    const where: FindOptionsWhere<LeaderboardEntry> = {}

    // Apply filters
    if (playerName) {
      where.playerName = playerName
    }

    if (gameId) {
      where.gameId = gameId
    }

    if (region) {
      where.region = region
    }

    if (platform) {
      where.platform = platform
    }

    // Score range
    if (minScore !== undefined && maxScore !== undefined) {
      where.score = Between(minScore, maxScore)
    } else if (minScore !== undefined) {
      where.score = MoreThanOrEqual(minScore)
    } else if (maxScore !== undefined) {
      where.score = LessThanOrEqual(maxScore)
    }

    // Date range
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate))
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate))
    }

    // Time frame filter
    if (timeFrame) {
      const now = new Date()
      let startDateTime: Date

      switch (timeFrame) {
        case TimeFrame.DAILY:
          startDateTime = new Date(now.setHours(0, 0, 0, 0))
          break
        case TimeFrame.WEEKLY:
          startDateTime = new Date(now.setDate(now.getDate() - now.getDay()))
          startDateTime.setHours(0, 0, 0, 0)
          break
        case TimeFrame.MONTHLY:
          startDateTime = new Date(now.setDate(1))
          startDateTime.setHours(0, 0, 0, 0)
          break
        case TimeFrame.ALL_TIME:
        default:
          startDateTime = null
      }

      if (startDateTime) {
        where.createdAt = MoreThanOrEqual(startDateTime)
      }
    }

    // Get total count
    const total = await this.leaderboardRepository.count({ where })

    // Get paginated data
    const data = await this.leaderboardRepository.find({
      where,
      order: { [sortBy || "score"]: sortOrder || "DESC" },
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

  async findOne(id: number): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({ where: { id } })
    if (!entry) {
      throw new NotFoundException(`Leaderboard entry with ID ${id} not found`)
    }
    return entry
  }

  async create(createDto: CreateLeaderboardEntryDto): Promise<LeaderboardEntry> {
    const newEntry = this.leaderboardRepository.create(createDto)

    // Check if this is a high score for the player
    const existingHighScore = await this.leaderboardRepository.findOne({
      where: { playerName: createDto.playerName },
      order: { score: "DESC" },
    })

    if (!existingHighScore || createDto.score > existingHighScore.score) {
      newEntry.isHighScore = true

      // If there was a previous high score, update it
      if (existingHighScore && existingHighScore.isHighScore) {
        existingHighScore.isHighScore = false
        await this.leaderboardRepository.save(existingHighScore)
      }
    }

    // Update last game date
    newEntry.lastGameDate = new Date()

    // Increment games played
    if (existingHighScore) {
      newEntry.gamesPlayed = existingHighScore.gamesPlayed + 1
    } else {
      newEntry.gamesPlayed = 1
    }

    return this.leaderboardRepository.save(newEntry)
  }

  async update(id: number, updateDto: UpdateLeaderboardEntryDto): Promise<LeaderboardEntry> {
    const entry = await this.findOne(id)
    const updated = Object.assign(entry, updateDto)
    return this.leaderboardRepository.save(updated)
  }

  async remove(id: number): Promise<void> {
    const entry = await this.findOne(id)
    await this.leaderboardRepository.remove(entry)
  }

  async getTopScoresByGame(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepository.find({
      where: { gameId },
      order: { score: "DESC" },
      take: limit,
    })
  }

  async getPlayerHighScore(playerName: string): Promise<LeaderboardEntry | null> {
    return this.leaderboardRepository.findOne({
      where: { playerName, isHighScore: true },
    })
  }

  async getPlayerHistory(playerName: string, limit = 10): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepository.find({
      where: { playerName },
      order: { createdAt: "DESC" },
      take: limit,
    })
  }

  async getPlayerProgress(playerName: string): Promise<any> {
    const entries = await this.leaderboardRepository.find({
      where: { playerName },
      order: { createdAt: "ASC" },
    })

    if (entries.length === 0) {
      return { progress: [] }
    }

    // Calculate progress metrics
    const firstScore = entries[0].score
    const latestScore = entries[entries.length - 1].score
    const highestScore = Math.max(...entries.map((entry) => entry.score))
    const averageScore = entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length
    const improvement = latestScore - firstScore
    const improvementPercentage = (improvement / firstScore) * 100

    // Group scores by date for trend analysis
    const scoresByDate = entries.reduce((acc, entry) => {
      const date = new Date(entry.createdAt).toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(entry.score)
      return acc
    }, {})

    const dailyAverages = Object.entries(scoresByDate).map(([date, scores]) => {
      const scoresArray = scores as number[]
      return {
        date,
        averageScore: scoresArray.reduce((sum, score) => sum + score, 0) / scoresArray.length,
        highestScore: Math.max(...scoresArray),
        gamesPlayed: scoresArray.length,
      }
    })

    return {
      playerName,
      gamesPlayed: entries.length,
      firstScore,
      latestScore,
      highestScore,
      averageScore,
      improvement,
      improvementPercentage,
      progress: dailyAverages,
    }
  }

  async getLeaderboardStats(statsDto: LeaderboardStatsDto): Promise<any> {
    const { gameId, region, platform, startDate, endDate } = statsDto

    const where: FindOptionsWhere<LeaderboardEntry> = {}

    if (gameId) {
      where.gameId = gameId
    }

    if (region) {
      where.region = region
    }

    if (platform) {
      where.platform = platform
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate))
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate))
    }

    const entries = await this.leaderboardRepository.find({ where })

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        uniquePlayers: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
      }
    }

    const uniquePlayers = new Set(entries.map((entry) => entry.playerName)).size
    const scores = entries.map((entry) => entry.score)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)

    // Score distribution
    const scoreRanges = {
      "0-100": 0,
      "101-500": 0,
      "501-1000": 0,
      "1001-5000": 0,
      "5001+": 0,
    }

    entries.forEach((entry) => {
      if (entry.score <= 100) scoreRanges["0-100"]++
      else if (entry.score <= 500) scoreRanges["101-500"]++
      else if (entry.score <= 1000) scoreRanges["501-1000"]++
      else if (entry.score <= 5000) scoreRanges["1001-5000"]++
      else scoreRanges["5001+"]++
    })

    // Platform distribution if available
    const platformDistribution = {}
    if (entries.some((entry) => entry.platform)) {
      entries.forEach((entry) => {
        if (entry.platform) {
          platformDistribution[entry.platform] = (platformDistribution[entry.platform] || 0) + 1
        }
      })
    }

    // Region distribution if available
    const regionDistribution = {}
    if (entries.some((entry) => entry.region)) {
      entries.forEach((entry) => {
        if (entry.region) {
          regionDistribution[entry.region] = (regionDistribution[entry.region] || 0) + 1
        }
      })
    }

    return {
      totalEntries: entries.length,
      uniquePlayers,
      averageScore,
      highestScore,
      lowestScore,
      scoreDistribution: scoreRanges,
      platformDistribution: Object.keys(platformDistribution).length > 0 ? platformDistribution : undefined,
      regionDistribution: Object.keys(regionDistribution).length > 0 ? regionDistribution : undefined,
    }
  }

  async getRegions(): Promise<string[]> {
    const regions = await this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .select("DISTINCT leaderboard.region")
      .where("leaderboard.region IS NOT NULL")
      .getRawMany()

    return regions.map((r) => r.region)
  }

  async getPlatforms(): Promise<string[]> {
    const platforms = await this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .select("DISTINCT leaderboard.platform")
      .where("leaderboard.platform IS NOT NULL")
      .getRawMany()

    return platforms.map((p) => p.platform)
  }

  async updatePlayTime(id: number, playTimeInSeconds: number): Promise<LeaderboardEntry> {
    const entry = await this.findOne(id)
    entry.totalPlayTime += playTimeInSeconds
    return this.leaderboardRepository.save(entry)
  }

  async searchPlayers(query: string, limit = 10): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .where("leaderboard.playerName ILIKE :query", { query: `%${query}%` })
      .orderBy("leaderboard.score", "DESC")
      .limit(limit)
      .getMany()
  }

  async getWeeklyLeaderboard(gameId?: string): Promise<LeaderboardEntry[]> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const query = this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .where("leaderboard.createdAt >= :oneWeekAgo", { oneWeekAgo })
      .orderBy("leaderboard.score", "DESC")
      .limit(10)

    if (gameId) {
      query.andWhere("leaderboard.gameId = :gameId", { gameId })
    }

    return query.getMany()
  }

  async getMonthlyLeaderboard(gameId?: string): Promise<LeaderboardEntry[]> {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const query = this.leaderboardRepository
      .createQueryBuilder("leaderboard")
      .where("leaderboard.createdAt >= :oneMonthAgo", { oneMonthAgo })
      .orderBy("leaderboard.score", "DESC")
      .limit(10)

    if (gameId) {
      query.andWhere("leaderboard.gameId = :gameId", { gameId })
    }

    return query.getMany()
  }
}
