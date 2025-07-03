import { Controller, Get, Post, Put, NotFoundException } from "@nestjs/common"
import type { LeaderboardServiceImpl } from "./leaderboard.service"
import { ResponseUtil } from "../utils/response.util"
import type { LeaderboardQuery } from "../interfaces/leaderboard.interface"

export interface UpdateStatsDto {
  score?: number
  totalPuzzlesCompleted?: number
  totalModulesCompleted?: number
  averageScore?: number
  completionPercentage?: number
  country?: string
  region?: string
  username?: string
  displayName?: string
}

export interface AwardBadgeDto {
  badgeId: string
  metadata?: Record<string, any>
}

@Controller()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardServiceImpl) {}

  // Leaderboard Endpoints
  @Get("leaderboard")
  async getLeaderboard(query: LeaderboardQuery) {
    const leaderboard = await this.leaderboardService.getLeaderboard(query)
    return ResponseUtil.success(leaderboard, "Leaderboard retrieved successfully")
  }

  @Get("leaderboard/global")
  async getGlobalLeaderboard(limit?: number, offset?: number, timeframe?: "daily" | "weekly" | "monthly" | "all_time") {
    const query: LeaderboardQuery = {
      type: "global",
      limit: limit || 50,
      offset: offset || 0,
      timeframe: timeframe || "all_time",
    }
    const leaderboard = await this.leaderboardService.getLeaderboard(query)
    return ResponseUtil.success(leaderboard, "Global leaderboard retrieved successfully")
  }

  @Get("leaderboard/country/:country")
  async getCountryLeaderboard(country: string, limit?: number, offset?: number) {
    const query: LeaderboardQuery = {
      type: "country",
      country,
      limit: limit || 50,
      offset: offset || 0,
    }
    const leaderboard = await this.leaderboardService.getLeaderboard(query)
    return ResponseUtil.success(leaderboard, `${country} leaderboard retrieved successfully`)
  }

  @Get("leaderboard/region/:region")
  async getRegionLeaderboard(region: string, limit?: number, offset?: number) {
    const query: LeaderboardQuery = {
      type: "region",
      region,
      limit: limit || 50,
      offset: offset || 0,
    }
    const leaderboard = await this.leaderboardService.getLeaderboard(query)
    return ResponseUtil.success(leaderboard, `${region} leaderboard retrieved successfully`)
  }

  @Get("users/:userId/rank")
  async getUserRank(userId: string, type: "global" | "country" | "region" = "global", country?: string) {
    const rank = await this.leaderboardService.getUserRank(userId, type, country)
    if (rank === -1) {
      throw new NotFoundException(`User ${userId} not found in ${type} leaderboard`)
    }
    return ResponseUtil.success({ rank, type, country }, "User rank retrieved successfully")
  }

  @Put("users/:userId/stats")
  async updateUserStats(userId: string, dto: UpdateStatsDto) {
    await this.leaderboardService.updateUserStats(userId, dto)
    return ResponseUtil.success(null, "User stats updated successfully")
  }

  @Post("leaderboard/refresh")
  async refreshLeaderboard() {
    await this.leaderboardService.refreshLeaderboard()
    return ResponseUtil.success(null, "Leaderboard refreshed successfully")
  }

  // Badge Endpoints
  @Get("badges")
  async getAllBadges() {
    const badges = await this.leaderboardService.getAllBadges()
    return ResponseUtil.success(badges, "Badges retrieved successfully")
  }

  @Get("users/:userId/badges")
  async getUserBadges(userId: string) {
    const userBadges = await this.leaderboardService.getUserBadges(userId)

    // Enrich with badge details
    const allBadges = await this.leaderboardService.getAllBadges()
    const badgeMap = new Map(allBadges.map((b) => [b.id, b]))

    const enrichedBadges = userBadges.map((userBadge) => ({
      ...userBadge,
      badge: badgeMap.get(userBadge.badgeId),
    }))

    return ResponseUtil.success(enrichedBadges, "User badges retrieved successfully")
  }

  @Post("users/:userId/badges/check")
  async checkAndAwardBadges(userId: string) {
    const newBadges = await this.leaderboardService.checkAndAwardBadges(userId)
    return ResponseUtil.success(newBadges, `Awarded ${newBadges.length} new badges`)
  }

  @Post("users/:userId/badges/award")
  async awardBadge(userId: string, dto: AwardBadgeDto) {
    const userBadge = await this.leaderboardService.awardBadge(userId, dto.badgeId, dto.metadata)
    return ResponseUtil.success(userBadge, "Badge awarded successfully")
  }

  // Achievement Progress Endpoints
  @Get("users/:userId/achievements/progress")
  async getAchievementProgress(userId: string) {
    const progress = await this.leaderboardService.getAchievementProgress(userId)
    return ResponseUtil.success(progress, "Achievement progress retrieved successfully")
  }

  @Put("users/:userId/achievements/:badgeId/progress")
  async updateAchievementProgress(userId: string, badgeId: string, value: number) {
    await this.leaderboardService.updateAchievementProgress(userId, badgeId, value)
    return ResponseUtil.success(null, "Achievement progress updated successfully")
  }
}
