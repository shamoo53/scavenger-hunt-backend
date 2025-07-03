import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type {
  LeaderboardEntry,
  LeaderboardQuery,
  LeaderboardResponse,
  Badge,
  UserBadge,
  AchievementProgress,
  LeaderboardService,
} from "../interfaces/leaderboard.interface"

@Injectable()
export class LeaderboardServiceImpl implements LeaderboardService {
  // In-memory storage for demo purposes
  private leaderboardEntries: Map<string, LeaderboardEntry> = new Map()
  private badges: Map<string, Badge> = new Map()
  private userBadges: Map<string, UserBadge[]> = new Map()
  private achievementProgress: Map<string, Map<string, AchievementProgress>> = new Map()

  constructor() {
    this.initializeBadges()
    this.initializeSampleData()
  }

  // Leaderboard Methods
  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResponse> {
    const { type, country, region, limit = 50, offset = 0, timeframe = "all_time" } = query

    let entries = Array.from(this.leaderboardEntries.values())

    // Filter by type
    if (type === "country" && country) {
      entries = entries.filter((entry) => entry.country === country)
    } else if (type === "region" && region) {
      entries = entries.filter((entry) => entry.region === region)
    }

    // Sort by score (descending) and completion percentage
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.completionPercentage !== a.completionPercentage) return b.completionPercentage - a.completionPercentage
      return b.totalPuzzlesCompleted - a.totalPuzzlesCompleted
    })

    // Add ranks and rank changes
    entries.forEach((entry, index) => {
      const previousRank = entry.rank
      entry.rank = index + 1

      if (previousRank) {
        if (entry.rank < previousRank) {
          entry.rankChange = "up"
        } else if (entry.rank > previousRank) {
          entry.rankChange = "down"
        } else {
          entry.rankChange = "same"
        }
      } else {
        entry.rankChange = "new"
      }
    })

    // Apply pagination
    const paginatedEntries = entries.slice(offset, offset + limit)

    return {
      entries: paginatedEntries,
      totalCount: entries.length,
      lastUpdated: new Date(),
      timeframe,
      type,
    }
  }

  async getUserRank(userId: string, type: "global" | "country" | "region", country?: string): Promise<number> {
    const query: LeaderboardQuery = { type, country, limit: 1000 }
    const leaderboard = await this.getLeaderboard(query)

    const userEntry = leaderboard.entries.find((entry) => entry.userId === userId)
    return userEntry?.rank || -1
  }

  async updateUserStats(userId: string, stats: Partial<LeaderboardEntry>): Promise<void> {
    const existingEntry = this.leaderboardEntries.get(userId)

    const updatedEntry: LeaderboardEntry = {
      userId,
      username: stats.username || existingEntry?.username || `user_${userId}`,
      displayName: stats.displayName || existingEntry?.displayName,
      avatar: stats.avatar || existingEntry?.avatar,
      score: stats.score ?? existingEntry?.score ?? 0,
      totalPuzzlesCompleted: stats.totalPuzzlesCompleted ?? existingEntry?.totalPuzzlesCompleted ?? 0,
      totalModulesCompleted: stats.totalModulesCompleted ?? existingEntry?.totalModulesCompleted ?? 0,
      averageScore: stats.averageScore ?? existingEntry?.averageScore ?? 0,
      completionPercentage: stats.completionPercentage ?? existingEntry?.completionPercentage ?? 0,
      lastActiveAt: new Date(),
      country: stats.country || existingEntry?.country,
      region: stats.region || existingEntry?.region,
      rank: existingEntry?.rank ?? 0,
      previousRank: existingEntry?.rank,
    }

    this.leaderboardEntries.set(userId, updatedEntry)

    // Check for new badges after stats update
    await this.checkAndAwardBadges(userId)
  }

  async refreshLeaderboard(): Promise<void> {
    // In a real implementation, this would refresh from database
    // For now, we'll just recalculate ranks
    const entries = Array.from(this.leaderboardEntries.values())
    entries.sort((a, b) => b.score - a.score)

    entries.forEach((entry, index) => {
      entry.previousRank = entry.rank
      entry.rank = index + 1
    })
  }

  // Badge Methods
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter((badge) => badge.isActive)
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadges.get(userId) || []
  }

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const userEntry = this.leaderboardEntries.get(userId)
    if (!userEntry) return []

    const existingBadges = await this.getUserBadges(userId)
    const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId))
    const newBadges: UserBadge[] = []

    for (const badge of this.badges.values()) {
      if (!badge.isActive || existingBadgeIds.has(badge.id)) continue

      const shouldAward = await this.checkBadgeCriteria(userId, badge, userEntry)
      if (shouldAward) {
        const userBadge = await this.awardBadge(userId, badge.id)
        newBadges.push(userBadge)
      }
    }

    return newBadges
  }

  async awardBadge(userId: string, badgeId: string, metadata?: Record<string, any>): Promise<UserBadge> {
    const badge = this.badges.get(badgeId)
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${badgeId} not found`)
    }

    const existingBadges = this.userBadges.get(userId) || []
    const alreadyEarned = existingBadges.some((b) => b.badgeId === badgeId)

    if (alreadyEarned) {
      throw new BadRequestException(`User ${userId} already has badge ${badgeId}`)
    }

    const userBadge: UserBadge = {
      userId,
      badgeId,
      earnedAt: new Date(),
      metadata,
    }

    existingBadges.push(userBadge)
    this.userBadges.set(userId, existingBadges)

    return userBadge
  }

  // Achievement Progress Methods
  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const userProgress = this.achievementProgress.get(userId) || new Map()
    const progress: AchievementProgress[] = []

    for (const badge of this.badges.values()) {
      if (!badge.isActive) continue

      const existingProgress = userProgress.get(badge.id)
      if (existingProgress) {
        progress.push(existingProgress)
      } else {
        // Create initial progress entry
        const initialProgress: AchievementProgress = {
          badgeId: badge.id,
          currentValue: 0,
          targetValue: badge.criteria.threshold || 1,
          progress: 0,
          isCompleted: false,
        }
        progress.push(initialProgress)
      }
    }

    return progress
  }

  async updateAchievementProgress(userId: string, badgeId: string, value: number): Promise<void> {
    const badge = this.badges.get(badgeId)
    if (!badge) return

    let userProgress = this.achievementProgress.get(userId)
    if (!userProgress) {
      userProgress = new Map()
      this.achievementProgress.set(userId, userProgress)
    }

    const targetValue = badge.criteria.threshold || 1
    const progress = Math.min(100, (value / targetValue) * 100)

    const achievementProgress: AchievementProgress = {
      badgeId,
      currentValue: value,
      targetValue,
      progress,
      isCompleted: value >= targetValue,
    }

    userProgress.set(badgeId, achievementProgress)
  }

  // Private Helper Methods
  private async checkBadgeCriteria(userId: string, badge: Badge, userEntry: LeaderboardEntry): Promise<boolean> {
    const { type, threshold = 1 } = badge.criteria

    switch (type) {
      case "first_puzzle":
        return userEntry.totalPuzzlesCompleted >= 1

      case "puzzle_count":
        return userEntry.totalPuzzlesCompleted >= threshold

      case "perfect_score":
        return userEntry.averageScore >= 100

      case "top_rank":
        return userEntry.rank <= threshold

      case "module_completion":
        return userEntry.totalModulesCompleted >= threshold

      case "daily_streak":
        // In a real implementation, this would check actual streak data
        return userEntry.totalPuzzlesCompleted >= threshold * 7 // Simulate daily activity

      case "weekly_streak":
        return userEntry.totalPuzzlesCompleted >= threshold * 7

      case "speed_completion":
        // This would require timing data in a real implementation
        return userEntry.totalPuzzlesCompleted >= threshold && userEntry.averageScore >= 80

      case "exploration_bonus":
        return userEntry.completionPercentage >= threshold

      default:
        return false
    }
  }

  private initializeBadges(): void {
    const badges: Badge[] = [
      {
        id: "first_puzzle",
        name: "First Steps",
        description: "Complete your first puzzle",
        iconUrl: "/badges/first-puzzle.png",
        category: "puzzle_completion",
        rarity: "common",
        criteria: { type: "first_puzzle" },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "puzzle_master_5",
        name: "Puzzle Apprentice",
        description: "Complete 5 puzzles",
        iconUrl: "/badges/puzzle-master-5.png",
        category: "puzzle_completion",
        rarity: "common",
        criteria: { type: "puzzle_count", threshold: 5 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "puzzle_master_25",
        name: "Puzzle Master",
        description: "Complete 25 puzzles",
        iconUrl: "/badges/puzzle-master-25.png",
        category: "puzzle_completion",
        rarity: "rare",
        criteria: { type: "puzzle_count", threshold: 25 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "perfect_score",
        name: "Perfectionist",
        description: "Achieve a perfect average score",
        iconUrl: "/badges/perfect-score.png",
        category: "puzzle_completion",
        rarity: "epic",
        criteria: { type: "perfect_score" },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "top_10",
        name: "Elite Player",
        description: "Reach top 10 on the leaderboard",
        iconUrl: "/badges/top-10.png",
        category: "ranking",
        rarity: "rare",
        criteria: { type: "top_rank", threshold: 10 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "top_3",
        name: "Champion",
        description: "Reach top 3 on the leaderboard",
        iconUrl: "/badges/champion.png",
        category: "ranking",
        rarity: "epic",
        criteria: { type: "top_rank", threshold: 3 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "number_one",
        name: "Legend",
        description: "Reach #1 on the leaderboard",
        iconUrl: "/badges/legend.png",
        category: "ranking",
        rarity: "legendary",
        criteria: { type: "top_rank", threshold: 1 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "daily_streak_7",
        name: "Consistent Learner",
        description: "Maintain a 7-day learning streak",
        iconUrl: "/badges/daily-streak-7.png",
        category: "streak",
        rarity: "uncommon",
        criteria: { type: "daily_streak", threshold: 7 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Complete 10 puzzles with high scores quickly",
        iconUrl: "/badges/speed-demon.png",
        category: "speed",
        rarity: "rare",
        criteria: { type: "speed_completion", threshold: 10 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "explorer",
        name: "Explorer",
        description: "Complete 75% of all available content",
        iconUrl: "/badges/explorer.png",
        category: "exploration",
        rarity: "epic",
        criteria: { type: "exploration_bonus", threshold: 75 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    badges.forEach((badge) => this.badges.set(badge.id, badge))
  }

  private initializeSampleData(): void {
    const sampleUsers = [
      {
        userId: "user1",
        username: "CryptoMaster",
        displayName: "Alex Johnson",
        score: 2450,
        totalPuzzlesCompleted: 28,
        totalModulesCompleted: 15,
        averageScore: 87.5,
        completionPercentage: 85,
        country: "US",
        region: "North America",
      },
      {
        userId: "user2",
        username: "NFTExplorer",
        displayName: "Sarah Chen",
        score: 2380,
        totalPuzzlesCompleted: 25,
        totalModulesCompleted: 18,
        averageScore: 95.2,
        completionPercentage: 90,
        country: "CA",
        region: "North America",
      },
      {
        userId: "user3",
        username: "BlockchainPro",
        displayName: "Mike Rodriguez",
        score: 2200,
        totalPuzzlesCompleted: 22,
        totalModulesCompleted: 12,
        averageScore: 100,
        completionPercentage: 70,
        country: "UK",
        region: "Europe",
      },
      {
        userId: "user4",
        username: "DigitalNomad",
        displayName: "Emma Wilson",
        score: 1950,
        totalPuzzlesCompleted: 19,
        totalModulesCompleted: 14,
        averageScore: 82.6,
        completionPercentage: 65,
        country: "AU",
        region: "Oceania",
      },
      {
        userId: "user5",
        username: "TechGuru",
        displayName: "David Kim",
        score: 1800,
        totalPuzzlesCompleted: 16,
        totalModulesCompleted: 10,
        averageScore: 90.0,
        completionPercentage: 55,
        country: "KR",
        region: "Asia",
      },
    ]

    sampleUsers.forEach((user, index) => {
      const entry: LeaderboardEntry = {
        ...user,
        lastActiveAt: new Date(),
        rank: index + 1,
        rankChange: "same",
      }
      this.leaderboardEntries.set(user.userId, entry)
    })
  }
}
