import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { NFTRewardsController } from "../nft-rewards.controller"
import { NFTRewardsServiceImpl } from "../nft-rewards.service"
import { jest } from "@jest/globals"

describe("NFTRewardsController", () => {
  let controller: NFTRewardsController
  let service: NFTRewardsServiceImpl

  const mockNFTRewardsService = {
    createReward: jest.fn(),
    getAllRewards: jest.fn(),
    getReward: jest.fn(),
    updateReward: jest.fn(),
    deactivateReward: jest.fn(),
    claimReward: jest.fn(),
    getUserClaims: jest.fn(),
    getClaimById: jest.fn(),
    checkEligibility: jest.fn(),
    checkAndDistributeRewards: jest.fn(),
    getTransactionStatus: jest.fn(),
    getRewardStats: jest.fn(),
    getUserRewardStats: jest.fn(),
    mintNFT: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NFTRewardsController],
      providers: [
        {
          provide: NFTRewardsServiceImpl,
          useValue: mockNFTRewardsService,
        },
      ],
    }).compile()

    controller = module.get<NFTRewardsController>(NFTRewardsController)
    service = module.get<NFTRewardsServiceImpl>(NFTRewardsServiceImpl)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createReward", () => {
    it("should create NFT reward successfully", async () => {
      const dto = {
        name: "Test Reward",
        description: "Test NFT reward",
        imageUrl: "https://example.com/image.png",
        category: "achievement_badge",
        rarity: "common",
        attributes: [{ trait_type: "Test", value: "Value" }],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721" as const,
        maxSupply: 1000,
      }

      const mockReward = { ...dto, id: "reward-123", createdAt: new Date(), updatedAt: new Date() }
      mockNFTRewardsService.createReward.mockResolvedValue(mockReward)

      const result = await controller.createReward(dto)

      expect(result).toEqual({
        success: true,
        data: mockReward,
        message: "NFT reward created successfully",
        timestamp: expect.any(String),
      })
      expect(service.createReward).toHaveBeenCalledWith(dto)
    })
  })

  describe("getAllRewards", () => {
    it("should return all NFT rewards", async () => {
      const mockRewards = [
        { id: "reward-1", name: "Reward 1", isActive: true },
        { id: "reward-2", name: "Reward 2", isActive: false },
      ]
      mockNFTRewardsService.getAllRewards.mockResolvedValue(mockRewards)

      const result = await controller.getAllRewards()

      expect(result).toEqual({
        success: true,
        data: mockRewards,
        message: "NFT rewards retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getReward", () => {
    it("should return specific NFT reward", async () => {
      const rewardId = "reward-123"
      const mockReward = { id: rewardId, name: "Test Reward" }
      mockNFTRewardsService.getReward.mockResolvedValue(mockReward)

      const result = await controller.getReward(rewardId)

      expect(result).toEqual({
        success: true,
        data: mockReward,
        message: "NFT reward retrieved successfully",
        timestamp: expect.any(String),
      })
    })

    it("should throw NotFoundException for non-existent reward", async () => {
      const rewardId = "non-existent"
      mockNFTRewardsService.getReward.mockResolvedValue(null)

      await expect(controller.getReward(rewardId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("claimReward", () => {
    it("should claim NFT reward successfully", async () => {
      const userId = "user-123"
      const dto = { rewardId: "reward-123", triggerData: { test: "data" } }
      const mockResponse = {
        success: true,
        claim: {
          id: "claim-123",
          userId,
          rewardId: dto.rewardId,
          tokenId: "token-123",
          transactionHash: "0xabc123",
          status: "completed",
        },
        transactionHash: "0xabc123",
        tokenId: "token-123",
      }

      mockNFTRewardsService.claimReward.mockResolvedValue(mockResponse)

      const result = await controller.claimReward(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockResponse,
        message: "NFT reward claimed successfully",
        timestamp: expect.any(String),
      })
    })

    it("should handle already claimed reward", async () => {
      const userId = "user-123"
      const dto = { rewardId: "reward-123" }
      const mockResponse = {
        success: false,
        alreadyClaimed: true,
        error: "Reward already claimed",
      }

      mockNFTRewardsService.claimReward.mockResolvedValue(mockResponse)

      const result = await controller.claimReward(userId, dto)

      expect(result).toEqual({
        success: false,
        error: "Reward already claimed",
        message: "Reward already claimed",
        timestamp: expect.any(String),
      })
    })

    it("should throw BadRequestException for failed claim", async () => {
      const userId = "user-123"
      const dto = { rewardId: "reward-123" }
      const mockResponse = {
        success: false,
        error: "User not eligible",
      }

      mockNFTRewardsService.claimReward.mockResolvedValue(mockResponse)

      await expect(controller.claimReward(userId, dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("getUserClaims", () => {
    it("should return user claims with reward details", async () => {
      const userId = "user-123"
      const mockClaims = [
        {
          id: "claim-1",
          userId,
          rewardId: "reward-1",
          tokenId: "token-1",
          status: "completed",
        },
      ]
      const mockReward = { id: "reward-1", name: "Test Reward" }

      mockNFTRewardsService.getUserClaims.mockResolvedValue(mockClaims)
      mockNFTRewardsService.getReward.mockResolvedValue(mockReward)

      const result = await controller.getUserClaims(userId)

      expect(result.data[0]).toEqual({
        ...mockClaims[0],
        reward: mockReward,
      })
    })
  })

  describe("getUserNFTs", () => {
    it("should return user NFT collection", async () => {
      const userId = "user-123"
      const mockClaims = [
        {
          id: "claim-1",
          userId,
          rewardId: "reward-1",
          tokenId: "token-1",
          contractAddress: "0x123",
          transactionHash: "0xabc",
          claimedAt: new Date(),
          status: "completed" as const,
        },
      ]
      const mockReward = {
        id: "reward-1",
        name: "Test NFT",
        description: "Test description",
        imageUrl: "https://example.com/image.png",
        category: "achievement_badge" as const,
        rarity: "common" as const,
        attributes: [],
      }

      mockNFTRewardsService.getUserClaims.mockResolvedValue(mockClaims)
      mockNFTRewardsService.getReward.mockResolvedValue(mockReward)

      const result = await controller.getUserNFTs(userId)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toHaveProperty("tokenId", "token-1")
      expect(result.data[0]).toHaveProperty("metadata")
      expect(result.data[0].metadata).toHaveProperty("name", "Test NFT")
    })
  })

  describe("checkEligibility", () => {
    it("should check user eligibility for reward", async () => {
      const userId = "user-123"
      const rewardId = "reward-123"
      mockNFTRewardsService.checkEligibility.mockResolvedValue(true)

      const result = await controller.checkEligibility(userId, rewardId)

      expect(result).toEqual({
        success: true,
        data: { userId, rewardId, isEligible: true },
        message: "Eligibility check completed",
        timestamp: expect.any(String),
      })
    })
  })

  describe("distributeRewards", () => {
    it("should distribute eligible rewards", async () => {
      const userId = "user-123"
      const triggerData = { totalPuzzlesCompleted: 5 }
      const mockDistributedRewards = [
        {
          id: "claim-1",
          userId,
          rewardId: "reward-1",
          tokenId: "token-1",
          status: "completed",
        },
      ]

      mockNFTRewardsService.checkAndDistributeRewards.mockResolvedValue(mockDistributedRewards)

      const result = await controller.distributeRewards(userId, triggerData)

      expect(result).toEqual({
        success: true,
        data: {
          userId,
          distributedCount: 1,
          rewards: mockDistributedRewards,
        },
        message: "Distributed 1 NFT rewards",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getRewardStats", () => {
    it("should return reward statistics", async () => {
      const mockStats = {
        totalRewards: 10,
        activeRewards: 8,
        totalClaims: 50,
        completedClaims: 45,
        successRate: 90,
      }

      mockNFTRewardsService.getRewardStats.mockResolvedValue(mockStats)

      const result = await controller.getRewardStats()

      expect(result).toEqual({
        success: true,
        data: mockStats,
        message: "Reward statistics retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("adminMintReward", () => {
    it("should mint NFT as admin", async () => {
      const rewardId = "reward-123"
      const recipientAddress = "0xabc123"
      const mockReward = {
        id: rewardId,
        name: "Test Reward",
        description: "Test description",
        imageUrl: "https://example.com/image.png",
        contractAddress: "0x123",
        attributes: [],
      }
      const mockMintResponse = {
        success: true,
        transactionHash: "0xdef456",
        tokenId: expect.any(String),
      }

      mockNFTRewardsService.getReward.mockResolvedValue(mockReward)
      mockNFTRewardsService.mintNFT.mockResolvedValue(mockMintResponse)

      const result = await controller.adminMintReward(rewardId, recipientAddress)

      expect(result).toEqual({
        success: true,
        data: mockMintResponse,
        message: "NFT minted successfully by admin",
        timestamp: expect.any(String),
      })
    })
  })
})
