import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { LeaderboardServiceImpl } from "../leaderboard.service"
import type { LeaderboardQuery } from "../../interfaces/leaderboard.interface"

describe("LeaderboardServiceImpl", () => {
  let service: LeaderboardServiceImpl

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaderboardServiceImpl],
    }).compile()

    service = module.get<LeaderboardServiceImpl>(LeaderboardServiceImpl)
  })

  describe("getLeaderboard", () => {
    it("should return global leaderboard", async () => {
      const query: LeaderboardQuery = { type: "global", limit: 10 }
      const result = await service.getLeaderboard(query)

      expect(result.entries).toBeDefined()
      expect(result.entries.length).toBeLessThanOrEqual(10)
      expect(result.totalCount).toBeGreaterThan(0)
      expect(result.type).toBe("global")
    })

    it("should return country-specific leaderboard", async () => {
      const query: LeaderboardQuery = { type: "country", country: "US", limit: 10 }
      const result = await service.getLeaderboard(query)

      expect(result.entries).toBeDefined()
      expect(result.entries.every((entry) => entry.country === "US")).toBe(true)
      expect(result.type).toBe("country")
    })

    it("should return region-specific leaderboard", async () => {
      const query: LeaderboardQuery = { type: "region", region: "North America", limit: 10 }
      const result = await service.getLeaderboard(query)

      expect(result.entries).toBeDefined()
      expect(result.entries.every((entry) => entry.region === "North America")).toBe(true)
      expect(result.type).toBe("region")
    })

    it("should sort entries by score in descending order", async () => {
      const query: LeaderboardQuery = { type: "global" }
      const result = await service.getLeaderboard(query)

      for (let i = 1; i < result.entries.length; i++) {
        expect(result.entries[i - 1].score).toBeGreaterThanOrEqual(result.entries[i].score)
      }
    })

    it("should assign correct ranks", async () => {
      const query: LeaderboardQuery = { type: "global" }
      const result = await service.getLeaderboard(query)

      result.entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1)
      })
    })
  })

  describe("getUserRank", () => {
    it("should return user rank in global leaderboard", async () => {
      const rank = await service.getUserRank("user1", "global")
      expect(rank).toBeGreaterThan(0)
    })

    it("should return -1 for non-existent user", async () => {
      const rank = await service.getUserRank("non_existent", "global")
      expect(rank).toBe(-1)
    })

    it("should return user rank in country leaderboard", async () => {
      const rank = await service.getUserRank("user1", "country", "US")
      expect(rank).toBeGreaterThan(0)
    })
  })

  describe("updateUserStats", () => {
    it("should update user stats successfully", async () => {
      const userId = "test_user"
      const stats = {
        username: "TestUser",
        score: 1500,
        totalPuzzlesCompleted: 10,
        totalModulesCompleted: 5,
        averageScore: 85,
        completionPercentage: 60,
        country: "US",
      }

      await service.updateUserStats(userId, stats)

      const rank = await service.getUserRank(userId, "global")
      expect(rank).toBeGreaterThan(0)
    })

    it("should trigger badge checking after stats update", async () => {
      const userId = "badge_test_user"
      const stats = {
        username: "BadgeTestUser",
        score: 500,
        totalPuzzlesCompleted: 1,
        averageScore: 100,
      }

      await service.updateUserStats(userId, stats)

      const badges = await service.getUserBadges(userId)
      expect(badges.length).toBeGreaterThan(0)
      expect(badges.some((b) => b.badgeId === "first_puzzle")).toBe(true)
    })
  })

  describe("getAllBadges", () => {
    it("should return all active badges", async () => {
      const badges = await service.getAllBadges()

      expect(badges.length).toBeGreaterThan(0)
      expect(badges.every((badge) => badge.isActive)).toBe(true)
      expect(badges.some((badge) => badge.id === "first_puzzle")).toBe(true)
    })
  })

  describe("getUserBadges", () => {
    it("should return empty array for user with no badges", async () => {
      const badges = await service.getUserBadges("new_user")
      expect(badges).toEqual([])
    })

    it("should return user badges after earning them", async () => {
      const userId = "badge_user"

      // Award a badge
      await service.awardBadge(userId, "first_puzzle")

      const badges = await service.getUserBadges(userId)
      expect(badges.length).toBe(1)
      expect(badges[0].badgeId).toBe("first_puzzle")
      expect(badges[0].earnedAt).toBeDefined()
    })
  })

  describe("awardBadge", () => {
    it("should award badge successfully", async () => {
      const userId = "award_test_user"
      const badgeId = "first_puzzle"

      const userBadge = await service.awardBadge(userId, badgeId)

      expect(userBadge.userId).toBe(userId)
      expect(userBadge.badgeId).toBe(badgeId)
      expect(userBadge.earnedAt).toBeDefined()
    })

    it("should throw NotFoundException for invalid badge", async () => {
      const userId = "test_user"
      const badgeId = "non_existent_badge"

      await expect(service.awardBadge(userId, badgeId)).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException for duplicate badge", async () => {
      const userId = "duplicate_test_user"
      const badgeId = "first_puzzle"

      // Award badge first time
      await service.awardBadge(userId, badgeId)

      // Try to award same badge again
      await expect(service.awardBadge(userId, badgeId)).rejects.toThrow(BadRequestException)
    })
  })

  describe("checkAndAwardBadges", () => {
    it("should award first puzzle badge when criteria met", async () => {
      const userId = "auto_award_user"

      // Update stats to meet first puzzle criteria
      await service.updateUserStats(userId, {
        totalPuzzlesCompleted: 1,
        score: 100,
      })

      const newBadges = await service.checkAndAwardBadges(userId)
      expect(newBadges.some((b) => b.badgeId === "first_puzzle")).toBe(true)
    })

    it("should award multiple badges when criteria met", async () => {
      const userId = "multi_badge_user"

      // Update stats to meet multiple criteria
      await service.updateUserStats(userId, {
        totalPuzzlesCompleted: 5,
        averageScore: 100,
        score: 1000,
      })

      const newBadges = await service.checkAndAwardBadges(userId)
      expect(newBadges.length).toBeGreaterThan(1)
    })

    it("should not award badges already earned", async () => {
      const userId = "no_duplicate_user"

      // Award badge manually first
      await service.awardBadge(userId, "first_puzzle")

      // Update stats to meet criteria
      await service.updateUserStats(userId, {
        totalPuzzlesCompleted: 1,
        score: 100,
      })

      const newBadges = await service.checkAndAwardBadges(userId)
      expect(newBadges.some((b) => b.badgeId === "first_puzzle")).toBe(false)
    })
  })

  describe("getAchievementProgress", () => {
    it("should return progress for all badges", async () => {
      const userId = "progress_user"
      const progress = await service.getAchievementProgress(userId)

      expect(progress.length).toBeGreaterThan(0)
      expect(progress.every((p) => p.badgeId)).toBe(true)
      expect(progress.every((p) => p.progress >= 0 && p.progress <= 100)).toBe(true)
    })
  })

  describe("updateAchievementProgress", () => {
    it("should update achievement progress", async () => {
      const userId = "progress_update_user"
      const badgeId = "puzzle_master_5"
      const value = 3

      await service.updateAchievementProgress(userId, badgeId, value)

      const progress = await service.getAchievementProgress(userId)
      const badgeProgress = progress.find((p) => p.badgeId === badgeId)

      expect(badgeProgress).toBeDefined()
      expect(badgeProgress!.currentValue).toBe(value)
      expect(badgeProgress!.progress).toBe(60) // 3/5 * 100
    })
  })

  describe("refreshLeaderboard", () => {
    it("should refresh leaderboard without errors", async () => {
      await expect(service.refreshLeaderboard()).resolves.not.toThrow()
    })
  })
})
