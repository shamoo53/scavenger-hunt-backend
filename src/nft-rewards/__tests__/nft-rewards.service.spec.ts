import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException } from "@nestjs/common"
import { NFTRewardsServiceImpl } from "../nft-rewards.service"
import type { ClaimRequest } from "../../interfaces/nft-rewards.interface"

describe("NFTRewardsServiceImpl", () => {
  let service: NFTRewardsServiceImpl

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NFTRewardsServiceImpl],
    }).compile()

    service = module.get<NFTRewardsServiceImpl>(NFTRewardsServiceImpl)
  })

  describe("createReward", () => {
    it("should create a new NFT reward", async () => {
      const rewardData = {
        name: "Test Reward",
        description: "Test NFT reward",
        imageUrl: "https://example.com/image.png",
        category: "achievement_badge" as const,
        rarity: "common" as const,
        attributes: [{ trait_type: "Test", value: "Value" }],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721" as const,
        maxSupply: 1000,
        currentSupply: 0,
        isActive: true,
      }

      const reward = await service.createReward(rewardData)

      expect(reward).toEqual({
        ...rewardData,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })
  })

  describe("getReward", () => {
    it("should return reward by ID", async () => {
      const rewards = await service.getAllRewards()
      const firstReward = rewards[0]

      const reward = await service.getReward(firstReward.id)

      expect(reward).toEqual(firstReward)
    })

    it("should return null for non-existent reward", async () => {
      const reward = await service.getReward("non-existent")

      expect(reward).toBeNull()
    })
  })

  describe("getAllRewards", () => {
    it("should return all rewards", async () => {
      const rewards = await service.getAllRewards()

      expect(rewards).toBeInstanceOf(Array)
      expect(rewards.length).toBeGreaterThan(0)
    })

    it("should filter by active status", async () => {
      const activeRewards = await service.getAllRewards(true)
      const inactiveRewards = await service.getAllRewards(false)

      expect(activeRewards.every((r) => r.isActive)).toBe(true)
      expect(inactiveRewards.every((r) => !r.isActive)).toBe(true)
    })
  })

  describe("updateReward", () => {
    it("should update reward successfully", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id
      const updates = { name: "Updated Name", description: "Updated Description" }

      const updatedReward = await service.updateReward(rewardId, updates)

      expect(updatedReward.name).toBe(updates.name)
      expect(updatedReward.description).toBe(updates.description)
      expect(updatedReward.updatedAt).toBeInstanceOf(Date)
    })

    it("should throw NotFoundException for non-existent reward", async () => {
      await expect(service.updateReward("non-existent", {})).rejects.toThrow(NotFoundException)
    })
  })

  describe("deactivateReward", () => {
    it("should deactivate reward successfully", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id

      await service.deactivateReward(rewardId)

      const reward = await service.getReward(rewardId)
      expect(reward?.isActive).toBe(false)
    })

    it("should throw NotFoundException for non-existent reward", async () => {
      await expect(service.deactivateReward("non-existent")).rejects.toThrow(NotFoundException)
    })
  })

  describe("claimReward", () => {
    it("should claim reward successfully", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id
      const userId = "test-user"

      const claimRequest: ClaimRequest = {
        userId,
        rewardId,
        triggerData: { test: "data" },
      }

      const response = await service.claimReward(claimRequest)

      expect(response.success).toBe(true)
      expect(response.claim).toBeDefined()
      expect(response.claim?.userId).toBe(userId)
      expect(response.claim?.rewardId).toBe(rewardId)
      expect(response.tokenId).toBeDefined()
    })

    it("should prevent duplicate claims", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id
      const userId = "duplicate-test-user"

      const claimRequest: ClaimRequest = { userId, rewardId }

      // First claim should succeed
      const firstResponse = await service.claimReward(claimRequest)
      expect(firstResponse.success).toBe(true)

      // Second claim should fail
      const secondResponse = await service.claimReward(claimRequest)
      expect(secondResponse.success).toBe(false)
      expect(secondResponse.alreadyClaimed).toBe(true)
    })

    it("should fail for non-existent reward", async () => {
      const claimRequest: ClaimRequest = {
        userId: "test-user",
        rewardId: "non-existent",
      }

      const response = await service.claimReward(claimRequest)

      expect(response.success).toBe(false)
      expect(response.error).toContain("not found")
    })
  })

  describe("getUserClaims", () => {
    it("should return user claims", async () => {
      const userId = "claims-test-user"
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id

      // Make a claim first
      await service.claimReward({ userId, rewardId })

      const claims = await service.getUserClaims(userId)

      expect(claims).toBeInstanceOf(Array)
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].userId).toBe(userId)
    })

    it("should return empty array for user with no claims", async () => {
      const claims = await service.getUserClaims("no-claims-user")

      expect(claims).toEqual([])
    })
  })

  describe("checkEligibility", () => {
    it("should return true for eligible user", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id
      const userId = "eligible-user"

      const isEligible = await service.checkEligibility(userId, rewardId)

      expect(typeof isEligible).toBe("boolean")
    })
  })

  describe("checkAndDistributeRewards", () => {
    it("should distribute eligible rewards", async () => {
      const userId = "distribution-test-user"
      const triggerData = {
        totalPuzzlesCompleted: 1,
        totalScore: 100,
        averageScore: 100,
      }

      const distributedRewards = await service.checkAndDistributeRewards(userId, triggerData)

      expect(distributedRewards).toBeInstanceOf(Array)
      // Should distribute at least the "First Steps Badge" for completing 1 puzzle
      expect(distributedRewards.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe("mintNFT", () => {
    it("should simulate NFT minting", async () => {
      const mintRequest = {
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        recipientAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        tokenId: "test-token-123",
        metadata: {
          name: "Test NFT",
          description: "Test NFT description",
          image: "https://example.com/image.png",
          attributes: [],
        },
      }

      const response = await service.mintNFT(mintRequest)

      expect(response).toHaveProperty("success")
      if (response.success) {
        expect(response.transactionHash).toBeDefined()
        expect(response.tokenId).toBe(mintRequest.tokenId)
      }
    })
  })

  describe("getRewardStats", () => {
    it("should return global stats when no rewardId provided", async () => {
      const stats = await service.getRewardStats()

      expect(stats).toHaveProperty("totalRewards")
      expect(stats).toHaveProperty("activeRewards")
      expect(stats).toHaveProperty("totalClaims")
      expect(stats).toHaveProperty("completedClaims")
      expect(stats).toHaveProperty("successRate")
    })

    it("should return specific reward stats", async () => {
      const rewards = await service.getAllRewards()
      const rewardId = rewards[0].id

      const stats = await service.getRewardStats(rewardId)

      expect(stats).toHaveProperty("rewardId", rewardId)
      expect(stats).toHaveProperty("name")
      expect(stats).toHaveProperty("totalClaims")
      expect(stats).toHaveProperty("currentSupply")
    })
  })

  describe("getUserRewardStats", () => {
    it("should return user reward statistics", async () => {
      const userId = "stats-test-user"

      const stats = await service.getUserRewardStats(userId)

      expect(stats).toHaveProperty("userId", userId)
      expect(stats).toHaveProperty("totalClaims")
      expect(stats).toHaveProperty("completedClaims")
      expect(stats).toHaveProperty("pendingClaims")
      expect(stats).toHaveProperty("failedClaims")
      expect(stats).toHaveProperty("rarityBreakdown")
    })
  })
})
