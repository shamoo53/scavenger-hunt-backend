import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException } from "@nestjs/common"
import { LeaderboardController } from "../leaderboard.controller"
import { LeaderboardServiceImpl } from "../leaderboard.service"
import { jest } from "@jest/globals"

describe("LeaderboardController", () => {
  let controller: LeaderboardController
  let service: LeaderboardServiceImpl

  const mockLeaderboardService = {
    getLeaderboard: jest.fn(),
    getUserRank: jest.fn(),
    updateUserStats: jest.fn(),
    refreshLeaderboard: jest.fn(),
    getAllBadges: jest.fn(),
    getUserBadges: jest.fn(),
    checkAndAwardBadges: jest.fn(),
    awardBadge: jest.fn(),
    getAchievementProgress: jest.fn(),
    updateAchievementProgress: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [
        {
          provide: LeaderboardServiceImpl,
          useValue: mockLeaderboardService,
        },
      ],
    }).compile()

    controller = module.get<LeaderboardController>(LeaderboardController)
    service = module.get<LeaderboardServiceImpl>(LeaderboardServiceImpl)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getGlobalLeaderboard", () => {
    it("should return global leaderboard", async () => {
      const mockLeaderboard = {
        entries: [
          { userId: "user1", username: "Player1", score: 1000, rank: 1 },
          { userId: "user2", username: "Player2", score: 900, rank: 2 },
        ],
        totalCount: 2,
        type: "global",
        lastUpdated: new Date(),
      }

      mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboard)

      const result = await controller.getGlobalLeaderboard()

      expect(result).toEqual({
        success: true,
        data: mockLeaderboard,
        message: "Global leaderboard retrieved successfully",
        timestamp: expect.any(String),
      })
      expect(service.getLeaderboard).toHaveBeenCalledWith({
        type: "global",
        limit: 50,
        offset: 0,
        timeframe: "all_time",
      })
    })
  })

  describe("getCountryLeaderboard", () => {
    it("should return country-specific leaderboard", async () => {
      const country = "US"
      const mockLeaderboard = {
        entries: [{ userId: "user1", username: "Player1", score: 1000, rank: 1, country: "US" }],
        totalCount: 1,
        type: "country",
        lastUpdated: new Date(),
      }

      mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboard)

      const result = await controller.getCountryLeaderboard(country)

      expect(result).toEqual({
        success: true,
        data: mockLeaderboard,
        message: `${country} leaderboard retrieved successfully`,
        timestamp: expect.any(String),
      })
      expect(service.getLeaderboard).toHaveBeenCalledWith({
        type: "country",
        country,
        limit: 50,
        offset: 0,
      })
    })
  })

  describe("getUserRank", () => {
    it("should return user rank", async () => {
      const userId = "user1"
      const rank = 5
      mockLeaderboardService.getUserRank.mockResolvedValue(rank)

      const result = await controller.getUserRank(userId)

      expect(result).toEqual({
        success: true,
        data: { rank, type: "global", country: undefined },
        message: "User rank retrieved successfully",
        timestamp: expect.any(String),
      })
    })

    it("should throw NotFoundException when user not found", async () => {
      const userId = "non_existent"
      mockLeaderboardService.getUserRank.mockResolvedValue(-1)

      await expect(controller.getUserRank(userId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("updateUserStats", () => {
    it("should update user stats", async () => {
      const userId = "user1"
      const dto = { score: 1500, totalPuzzlesCompleted: 10 }

      mockLeaderboardService.updateUserStats.mockResolvedValue(undefined)

      const result = await controller.updateUserStats(userId, dto)

      expect(result).toEqual({
        success: true,
        data: null,
        message: "User stats updated successfully",
        timestamp: expect.any(String),
      })
      expect(service.updateUserStats).toHaveBeenCalledWith(userId, dto)
    })
  })

  describe("getAllBadges", () => {
    it("should return all badges", async () => {
      const mockBadges = [
        {
          id: "first_puzzle",
          name: "First Steps",
          description: "Complete your first puzzle",
          iconUrl: "/badges/first-puzzle.png",
        },
      ]

      mockLeaderboardService.getAllBadges.mockResolvedValue(mockBadges)

      const result = await controller.getAllBadges()

      expect(result).toEqual({
        success: true,
        data: mockBadges,
        message: "Badges retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getUserBadges", () => {
    it("should return user badges with enriched data", async () => {
      const userId = "user1"
      const mockUserBadges = [
        {
          userId,
          badgeId: "first_puzzle",
          earnedAt: new Date(),
        },
      ]
      const mockAllBadges = [
        {
          id: "first_puzzle",
          name: "First Steps",
          description: "Complete your first puzzle",
          iconUrl: "/badges/first-puzzle.png",
        },
      ]

      mockLeaderboardService.getUserBadges.mockResolvedValue(mockUserBadges)
      mockLeaderboardService.getAllBadges.mockResolvedValue(mockAllBadges)

      const result = await controller.getUserBadges(userId)

      expect(result.data[0]).toEqual({
        ...mockUserBadges[0],
        badge: mockAllBadges[0],
      })
    })
  })

  describe("checkAndAwardBadges", () => {
    it("should check and award new badges", async () => {
      const userId = "user1"
      const mockNewBadges = [
        {
          userId,
          badgeId: "first_puzzle",
          earnedAt: new Date(),
        },
      ]

      mockLeaderboardService.checkAndAwardBadges.mockResolvedValue(mockNewBadges)

      const result = await controller.checkAndAwardBadges(userId)

      expect(result).toEqual({
        success: true,
        data: mockNewBadges,
        message: "Awarded 1 new badges",
        timestamp: expect.any(String),
      })
    })
  })

  describe("awardBadge", () => {
    it("should award badge to user", async () => {
      const userId = "user1"
      const dto = { badgeId: "first_puzzle" }
      const mockUserBadge = {
        userId,
        badgeId: "first_puzzle",
        earnedAt: new Date(),
      }

      mockLeaderboardService.awardBadge.mockResolvedValue(mockUserBadge)

      const result = await controller.awardBadge(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockUserBadge,
        message: "Badge awarded successfully",
        timestamp: expect.any(String),
      })
      expect(service.awardBadge).toHaveBeenCalledWith(userId, dto.badgeId, dto.metadata)
    })
  })

  describe("getAchievementProgress", () => {
    it("should return achievement progress", async () => {
      const userId = "user1"
      const mockProgress = [
        {
          badgeId: "puzzle_master_5",
          currentValue: 3,
          targetValue: 5,
          progress: 60,
          isCompleted: false,
        },
      ]

      mockLeaderboardService.getAchievementProgress.mockResolvedValue(mockProgress)

      const result = await controller.getAchievementProgress(userId)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "Achievement progress retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("updateAchievementProgress", () => {
    it("should update achievement progress", async () => {
      const userId = "user1"
      const badgeId = "puzzle_master_5"
      const value = 4

      mockLeaderboardService.updateAchievementProgress.mockResolvedValue(undefined)

      const result = await controller.updateAchievementProgress(userId, badgeId, value)

      expect(result).toEqual({
        success: true,
        data: null,
        message: "Achievement progress updated successfully",
        timestamp: expect.any(String),
      })
      expect(service.updateAchievementProgress).toHaveBeenCalledWith(userId, badgeId, value)
    })
  })
})
