import { Controller, Get, Post, Put, Delete, NotFoundException, BadRequestException } from "@nestjs/common"
import type { NFTRewardsServiceImpl } from "./nft-rewards.service"
import { ResponseUtil } from "../utils/response.util"
import type { ClaimRequest } from "../interfaces/nft-rewards.interface"

export interface CreateRewardDto {
  name: string
  description: string
  imageUrl: string
  animationUrl?: string
  category: string
  rarity: string
  attributes: Array<{
    trait_type: string
    value: string | number
    display_type?: string
    max_value?: number
  }>
  contractAddress: string
  tokenStandard: "ERC721" | "ERC1155"
  maxSupply?: number
}

export interface ClaimRewardDto {
  rewardId: string
  triggerData?: Record<string, any>
}

export interface UpdateRewardDto {
  name?: string
  description?: string
  imageUrl?: string
  animationUrl?: string
  isActive?: boolean
  maxSupply?: number
}

@Controller()
export class NFTRewardsController {
  constructor(private readonly nftRewardsService: NFTRewardsServiceImpl) {}

  // Reward Management Endpoints
  @Post("rewards")
  async createReward(dto: CreateRewardDto) {
    try {
      const reward = await this.nftRewardsService.createReward(dto)
      return ResponseUtil.success(reward, "NFT reward created successfully")
    } catch (error) {
      throw new BadRequestException("Failed to create NFT reward")
    }
  }

  @Get("rewards")
  async getAllRewards(isActive?: boolean) {
    const rewards = await this.nftRewardsService.getAllRewards(isActive)
    return ResponseUtil.success(rewards, "NFT rewards retrieved successfully")
  }

  @Get("rewards/:rewardId")
  async getReward(rewardId: string) {
    const reward = await this.nftRewardsService.getReward(rewardId)
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`)
    }
    return ResponseUtil.success(reward, "NFT reward retrieved successfully")
  }

  @Put("rewards/:rewardId")
  async updateReward(rewardId: string, dto: UpdateRewardDto) {
    try {
      const reward = await this.nftRewardsService.updateReward(rewardId, dto)
      return ResponseUtil.success(reward, "NFT reward updated successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to update NFT reward")
    }
  }

  @Delete("rewards/:rewardId")
  async deactivateReward(rewardId: string) {
    try {
      await this.nftRewardsService.deactivateReward(rewardId)
      return ResponseUtil.success(null, "NFT reward deactivated successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to deactivate NFT reward")
    }
  }

  // Claim Management Endpoints
  @Post("users/:userId/claims")
  async claimReward(userId: string, dto: ClaimRewardDto) {
    const claimRequest: ClaimRequest = {
      userId,
      rewardId: dto.rewardId,
      triggerData: dto.triggerData,
    }

    const response = await this.nftRewardsService.claimReward(claimRequest)

    if (response.success) {
      return ResponseUtil.success(response, "NFT reward claimed successfully")
    } else {
      if (response.alreadyClaimed) {
        return ResponseUtil.error("Reward already claimed", response.error)
      }
      throw new BadRequestException(response.error || "Failed to claim NFT reward")
    }
  }

  @Get("users/:userId/claims")
  async getUserClaims(userId: string) {
    const claims = await this.nftRewardsService.getUserClaims(userId)

    // Enrich claims with reward details
    const enrichedClaims = await Promise.all(
      claims.map(async (claim) => {
        const reward = await this.nftRewardsService.getReward(claim.rewardId)
        return {
          ...claim,
          reward,
        }
      }),
    )

    return ResponseUtil.success(enrichedClaims, "User NFT claims retrieved successfully")
  }

  @Get("users/:userId/nfts")
  async getUserNFTs(userId: string) {
    const claims = await this.nftRewardsService.getUserClaims(userId)
    const completedClaims = claims.filter((claim) => claim.status === "completed")

    // Enrich with reward details and format as NFT collection
    const nfts = await Promise.all(
      completedClaims.map(async (claim) => {
        const reward = await this.nftRewardsService.getReward(claim.rewardId)
        return {
          tokenId: claim.tokenId,
          contractAddress: claim.contractAddress,
          transactionHash: claim.transactionHash,
          claimedAt: claim.claimedAt,
          metadata: {
            name: reward?.name,
            description: reward?.description,
            image: reward?.imageUrl,
            animation_url: reward?.animationUrl,
            attributes: reward?.attributes,
            external_url: `https://nft-scavenger-hunt.com/nft/${claim.tokenId}`,
          },
          reward: {
            id: reward?.id,
            name: reward?.name,
            category: reward?.category,
            rarity: reward?.rarity,
          },
        }
      }),
    )

    return ResponseUtil.success(nfts, "User NFT collection retrieved successfully")
  }

  @Get("claims/:claimId")
  async getClaimById(claimId: string) {
    const claim = await this.nftRewardsService.getClaimById(claimId)
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`)
    }

    const reward = await this.nftRewardsService.getReward(claim.rewardId)

    return ResponseUtil.success({ ...claim, reward }, "NFT claim retrieved successfully")
  }

  @Get("users/:userId/eligibility/:rewardId")
  async checkEligibility(userId: string, rewardId: string) {
    const isEligible = await this.nftRewardsService.checkEligibility(userId, rewardId)
    return ResponseUtil.success({ userId, rewardId, isEligible }, "Eligibility check completed")
  }

  // Reward Distribution Endpoints
  @Post("users/:userId/distribute-rewards")
  async distributeRewards(userId: string, triggerData: Record<string, any> = {}) {
    const distributedRewards = await this.nftRewardsService.checkAndDistributeRewards(userId, triggerData)

    return ResponseUtil.success(
      {
        userId,
        distributedCount: distributedRewards.length,
        rewards: distributedRewards,
      },
      `Distributed ${distributedRewards.length} NFT rewards`,
    )
  }

  // StarkNet Integration Endpoints
  @Get("transactions/:transactionHash/status")
  async getTransactionStatus(transactionHash: string) {
    const status = await this.nftRewardsService.getTransactionStatus(transactionHash)
    return ResponseUtil.success({ transactionHash, status }, "Transaction status retrieved successfully")
  }

  // Analytics Endpoints
  @Get("analytics/rewards/:rewardId?")
  async getRewardStats(rewardId?: string) {
    const stats = await this.nftRewardsService.getRewardStats(rewardId)
    return ResponseUtil.success(stats, "Reward statistics retrieved successfully")
  }

  @Get("analytics/users/:userId")
  async getUserRewardStats(userId: string) {
    const stats = await this.nftRewardsService.getUserRewardStats(userId)
    return ResponseUtil.success(stats, "User reward statistics retrieved successfully")
  }

  // Admin Endpoints
  @Post("admin/rewards/:rewardId/mint")
  async adminMintReward(rewardId: string, recipientAddress: string, metadata?: Record<string, any>) {
    const reward = await this.nftRewardsService.getReward(rewardId)
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`)
    }

    const tokenId = `admin_${rewardId}_${Date.now()}`
    const mintRequest = {
      contractAddress: reward.contractAddress,
      recipientAddress,
      tokenId,
      metadata: {
        name: reward.name,
        description: reward.description,
        image: reward.imageUrl,
        animation_url: reward.animationUrl,
        attributes: reward.attributes,
        external_url: `https://nft-scavenger-hunt.com/nft/${tokenId}`,
        ...metadata,
      },
    }

    const response = await this.nftRewardsService.mintNFT(mintRequest)

    if (response.success) {
      return ResponseUtil.success(response, "NFT minted successfully by admin")
    } else {
      throw new BadRequestException(response.error || "Failed to mint NFT")
    }
  }
}
