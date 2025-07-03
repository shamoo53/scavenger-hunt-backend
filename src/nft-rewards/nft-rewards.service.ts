import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import type {
  NFTReward,
  UserNFTClaim,
  ClaimRequest,
  ClaimResponse,
  StarkNetMintRequest,
  StarkNetMintResponse,
  RewardCriteria,
  NFTRewardsService,
} from "../interfaces/nft-rewards.interface"

@Injectable()
export class NFTRewardsServiceImpl implements NFTRewardsService {
  private readonly logger = new Logger(NFTRewardsServiceImpl.name)

  // In-memory storage for demo purposes
  private rewards: Map<string, NFTReward> = new Map()
  private userClaims: Map<string, UserNFTClaim[]> = new Map()
  private rewardCriteria: Map<string, RewardCriteria> = new Map()

  // StarkNet configuration (would be from environment variables)
  private readonly starkNetConfig = {
    rpcUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io",
    privateKey: process.env.STARKNET_PRIVATE_KEY || "0x...",
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS || "0x...",
  }

  constructor() {
    this.initializeSampleRewards()
  }

  // Reward Management
  async createReward(rewardData: Omit<NFTReward, "id" | "createdAt" | "updatedAt">): Promise<NFTReward> {
    const reward: NFTReward = {
      ...rewardData,
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.rewards.set(reward.id, reward)
    this.logger.log(`Created new NFT reward: ${reward.name} (${reward.id})`)

    return reward
  }

  async getReward(rewardId: string): Promise<NFTReward | null> {
    return this.rewards.get(rewardId) || null
  }

  async getAllRewards(isActive?: boolean): Promise<NFTReward[]> {
    const rewards = Array.from(this.rewards.values())

    if (isActive !== undefined) {
      return rewards.filter((reward) => reward.isActive === isActive)
    }

    return rewards
  }

  async updateReward(rewardId: string, updates: Partial<NFTReward>): Promise<NFTReward> {
    const reward = this.rewards.get(rewardId)
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`)
    }

    const updatedReward = {
      ...reward,
      ...updates,
      updatedAt: new Date(),
    }

    this.rewards.set(rewardId, updatedReward)
    this.logger.log(`Updated NFT reward: ${rewardId}`)

    return updatedReward
  }

  async deactivateReward(rewardId: string): Promise<void> {
    const reward = this.rewards.get(rewardId)
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`)
    }

    reward.isActive = false
    reward.updatedAt = new Date()
    this.rewards.set(rewardId, reward)

    this.logger.log(`Deactivated NFT reward: ${rewardId}`)
  }

  // Claim Management
  async claimReward(request: ClaimRequest): Promise<ClaimResponse> {
    const { userId, rewardId, triggerData } = request

    try {
      // Check if reward exists and is active
      const reward = await this.getReward(rewardId)
      if (!reward || !reward.isActive) {
        return {
          success: false,
          error: "Reward not found or inactive",
        }
      }

      // Check for duplicate claims
      const existingClaim = await this.checkDuplicateClaim(userId, rewardId)
      if (existingClaim) {
        return {
          success: false,
          alreadyClaimed: true,
          error: "Reward already claimed",
          claim: existingClaim,
        }
      }

      // Check eligibility
      const isEligible = await this.checkEligibility(userId, rewardId)
      if (!isEligible) {
        return {
          success: false,
          error: "User not eligible for this reward",
        }
      }

      // Check supply limits
      if (reward.maxSupply && reward.currentSupply >= reward.maxSupply) {
        return {
          success: false,
          error: "Reward supply exhausted",
        }
      }

      // Create claim record
      const tokenId = `${rewardId}_${userId}_${Date.now()}`
      const claim: UserNFTClaim = {
        id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        rewardId,
        tokenId,
        transactionHash: "",
        contractAddress: reward.contractAddress,
        claimedAt: new Date(),
        status: "pending",
        metadata: triggerData,
      }

      // Store claim
      const userClaims = this.userClaims.get(userId) || []
      userClaims.push(claim)
      this.userClaims.set(userId, userClaims)

      // Update claim status to minting
      claim.status = "minting"

      // Mint NFT on StarkNet
      const mintRequest: StarkNetMintRequest = {
        contractAddress: reward.contractAddress,
        recipientAddress: userId, // In real implementation, this would be user's wallet address
        tokenId,
        metadata: {
          name: reward.name,
          description: reward.description,
          image: reward.imageUrl,
          animation_url: reward.animationUrl,
          attributes: reward.attributes,
          external_url: `https://nft-scavenger-hunt.com/nft/${tokenId}`,
        },
      }

      const mintResponse = await this.mintNFT(mintRequest)

      if (mintResponse.success) {
        // Update claim with transaction details
        claim.transactionHash = mintResponse.transactionHash!
        claim.status = "completed"

        // Update reward supply
        reward.currentSupply += 1
        this.rewards.set(rewardId, reward)

        this.logger.log(`Successfully minted NFT for user ${userId}: ${tokenId}`)

        return {
          success: true,
          claim,
          transactionHash: mintResponse.transactionHash,
          tokenId,
        }
      } else {
        // Update claim status to failed
        claim.status = "failed"

        return {
          success: false,
          error: mintResponse.error || "Minting failed",
          claim,
        }
      }
    } catch (error) {
      this.logger.error(`Error claiming reward ${rewardId} for user ${userId}:`, error)
      return {
        success: false,
        error: "Internal server error during claim process",
      }
    }
  }

  async getUserClaims(userId: string): Promise<UserNFTClaim[]> {
    return this.userClaims.get(userId) || []
  }

  async getClaimById(claimId: string): Promise<UserNFTClaim | null> {
    for (const claims of this.userClaims.values()) {
      const claim = claims.find((c) => c.id === claimId)
      if (claim) return claim
    }
    return null
  }

  async checkEligibility(userId: string, rewardId: string): Promise<boolean> {
    const criteria = this.rewardCriteria.get(rewardId)
    if (!criteria) {
      // If no criteria defined, assume eligible
      return true
    }

    // In a real implementation, this would fetch user data from database
    const userData = await this.getUserData(userId)

    return this.evaluateRewardCriteria(criteria, userData, {})
  }

  // Reward Distribution
  async checkAndDistributeRewards(userId: string, triggerData: Record<string, any>): Promise<UserNFTClaim[]> {
    const distributedRewards: UserNFTClaim[] = []

    for (const [rewardId, criteria] of this.rewardCriteria.entries()) {
      const reward = this.rewards.get(rewardId)
      if (!reward || !reward.isActive) continue

      // Check if user already has this reward (for non-repeatable rewards)
      if (!criteria.isRepeatable) {
        const existingClaim = await this.checkDuplicateClaim(userId, rewardId)
        if (existingClaim) continue
      }

      // Check cooldown period for repeatable rewards
      if (criteria.isRepeatable && criteria.cooldownPeriod) {
        const lastClaim = await this.getLastClaim(userId, rewardId)
        if (lastClaim) {
          const cooldownEnd = new Date(lastClaim.claimedAt.getTime() + criteria.cooldownPeriod * 60 * 60 * 1000)
          if (new Date() < cooldownEnd) continue
        }
      }

      // Evaluate criteria
      const userData = await this.getUserData(userId)
      const isEligible = await this.evaluateRewardCriteria(criteria, userData, triggerData)

      if (isEligible) {
        const claimResponse = await this.claimReward({ userId, rewardId, triggerData })
        if (claimResponse.success && claimResponse.claim) {
          distributedRewards.push(claimResponse.claim)
        }
      }
    }

    return distributedRewards
  }

  async evaluateRewardCriteria(criteria: RewardCriteria, userData: any, triggerData: any): Promise<boolean> {
    for (const condition of criteria.conditions) {
      const value = userData[condition.field] ?? triggerData[condition.field]

      if (!this.evaluateCondition(value, condition.operator, condition.value)) {
        return false
      }
    }

    return true
  }

  // StarkNet Integration
  async mintNFT(request: StarkNetMintRequest): Promise<StarkNetMintResponse> {
    try {
      // Simulate StarkNet minting process
      // In a real implementation, this would use StarkNet.js or similar library

      this.logger.log(`Minting NFT on StarkNet:`, {
        contract: request.contractAddress,
        recipient: request.recipientAddress,
        tokenId: request.tokenId,
      })

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful minting (90% success rate)
      const success = Math.random() > 0.1

      if (success) {
        const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`

        this.logger.log(`NFT minted successfully: ${transactionHash}`)

        return {
          success: true,
          transactionHash,
          tokenId: request.tokenId,
        }
      } else {
        return {
          success: false,
          error: "StarkNet transaction failed",
        }
      }
    } catch (error) {
      this.logger.error("Error minting NFT on StarkNet:", error)
      return {
        success: false,
        error: error.message || "Unknown minting error",
      }
    }
  }

  async getTransactionStatus(transactionHash: string): Promise<string> {
    // Simulate checking transaction status on StarkNet
    // In real implementation, this would query the StarkNet network

    const statuses = ["pending", "accepted_on_l2", "accepted_on_l1", "rejected"]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  // Analytics
  async getRewardStats(rewardId?: string): Promise<any> {
    if (rewardId) {
      const reward = this.rewards.get(rewardId)
      if (!reward) {
        throw new NotFoundException(`Reward ${rewardId} not found`)
      }

      const totalClaims = Array.from(this.userClaims.values())
        .flat()
        .filter((claim) => claim.rewardId === rewardId).length

      return {
        rewardId,
        name: reward.name,
        totalClaims,
        currentSupply: reward.currentSupply,
        maxSupply: reward.maxSupply,
        claimRate: reward.maxSupply ? (totalClaims / reward.maxSupply) * 100 : null,
      }
    }

    // Global stats
    const totalRewards = this.rewards.size
    const activeRewards = Array.from(this.rewards.values()).filter((r) => r.isActive).length
    const totalClaims = Array.from(this.userClaims.values()).flat().length
    const completedClaims = Array.from(this.userClaims.values())
      .flat()
      .filter((claim) => claim.status === "completed").length

    return {
      totalRewards,
      activeRewards,
      totalClaims,
      completedClaims,
      successRate: totalClaims > 0 ? (completedClaims / totalClaims) * 100 : 0,
    }
  }

  async getUserRewardStats(userId: string): Promise<any> {
    const userClaims = await this.getUserClaims(userId)
    const completedClaims = userClaims.filter((claim) => claim.status === "completed")
    const pendingClaims = userClaims.filter((claim) => claim.status === "pending" || claim.status === "minting")
    const failedClaims = userClaims.filter((claim) => claim.status === "failed")

    const rarityCount = completedClaims.reduce(
      (acc, claim) => {
        const reward = this.rewards.get(claim.rewardId)
        if (reward) {
          acc[reward.rarity] = (acc[reward.rarity] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      userId,
      totalClaims: userClaims.length,
      completedClaims: completedClaims.length,
      pendingClaims: pendingClaims.length,
      failedClaims: failedClaims.length,
      rarityBreakdown: rarityCount,
      firstClaimDate: userClaims.length > 0 ? userClaims[0].claimedAt : null,
      lastClaimDate: userClaims.length > 0 ? userClaims[userClaims.length - 1].claimedAt : null,
    }
  }

  // Private Helper Methods
  private async checkDuplicateClaim(userId: string, rewardId: string): Promise<UserNFTClaim | null> {
    const userClaims = this.userClaims.get(userId) || []
    return userClaims.find((claim) => claim.rewardId === rewardId && claim.status === "completed") || null
  }

  private async getLastClaim(userId: string, rewardId: string): Promise<UserNFTClaim | null> {
    const userClaims = this.userClaims.get(userId) || []
    const rewardClaims = userClaims.filter((claim) => claim.rewardId === rewardId)

    if (rewardClaims.length === 0) return null

    return rewardClaims.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())[0]
  }

  private async getUserData(userId: string): Promise<any> {
    // In a real implementation, this would fetch from database
    // For demo, return mock user data
    return {
      totalPuzzlesCompleted: 15,
      totalScore: 1500,
      averageScore: 85,
      completionPercentage: 75,
      currentStreak: 7,
      totalBadges: 5,
      leaderboardRank: 25,
    }
  }

  private evaluateCondition(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case "eq":
        return value === targetValue
      case "gt":
        return value > targetValue
      case "gte":
        return value >= targetValue
      case "lt":
        return value < targetValue
      case "lte":
        return value <= targetValue
      case "in":
        return Array.isArray(targetValue) && targetValue.includes(value)
      case "contains":
        return typeof value === "string" && value.includes(targetValue)
      default:
        return false
    }
  }

  private initializeSampleRewards(): void {
    // Sample NFT rewards
    const rewards: Omit<NFTReward, "id" | "createdAt" | "updatedAt">[] = [
      {
        name: "First Steps Badge",
        description: "Commemorative NFT for completing your first puzzle",
        imageUrl: "https://nft-rewards.com/images/first-steps.png",
        category: "achievement_badge",
        rarity: "common",
        attributes: [
          { trait_type: "Achievement", value: "First Puzzle" },
          { trait_type: "Rarity", value: "Common" },
          { trait_type: "Date Earned", value: "2024", display_type: "date" },
        ],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721",
        maxSupply: 10000,
        currentSupply: 0,
        isActive: true,
      },
      {
        name: "Puzzle Master Trophy",
        description: "Exclusive NFT for completing 25 puzzles",
        imageUrl: "https://nft-rewards.com/images/puzzle-master.png",
        animationUrl: "https://nft-rewards.com/animations/puzzle-master.mp4",
        category: "milestone_reward",
        rarity: "rare",
        attributes: [
          { trait_type: "Achievement", value: "Puzzle Master" },
          { trait_type: "Rarity", value: "Rare" },
          { trait_type: "Puzzles Completed", value: 25, display_type: "number" },
        ],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721",
        maxSupply: 1000,
        currentSupply: 0,
        isActive: true,
      },
      {
        name: "Leaderboard Champion",
        description: "Legendary NFT for reaching #1 on the global leaderboard",
        imageUrl: "https://nft-rewards.com/images/champion.png",
        animationUrl: "https://nft-rewards.com/animations/champion.mp4",
        category: "leaderboard_prize",
        rarity: "legendary",
        attributes: [
          { trait_type: "Achievement", value: "Global Champion" },
          { trait_type: "Rarity", value: "Legendary" },
          { trait_type: "Rank", value: 1, display_type: "number" },
        ],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721",
        maxSupply: 10,
        currentSupply: 0,
        isActive: true,
      },
      {
        name: "Speed Demon",
        description: "Epic NFT for completing puzzles with exceptional speed",
        imageUrl: "https://nft-rewards.com/images/speed-demon.png",
        category: "special_event",
        rarity: "epic",
        attributes: [
          { trait_type: "Achievement", value: "Speed Completion" },
          { trait_type: "Rarity", value: "Epic" },
          { trait_type: "Speed Bonus", value: 150, display_type: "boost_percentage" },
        ],
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenStandard: "ERC721",
        maxSupply: 500,
        currentSupply: 0,
        isActive: true,
      },
    ]

    // Create rewards and criteria
    rewards.forEach(async (rewardData) => {
      const reward = await this.createReward(rewardData)

      // Set up reward criteria
      let criteria: RewardCriteria

      switch (reward.name) {
        case "First Steps Badge":
          criteria = {
            type: "puzzle_completion",
            conditions: [
              { field: "totalPuzzlesCompleted", operator: "gte", value: 1, description: "Complete at least 1 puzzle" },
            ],
            isRepeatable: false,
          }
          break

        case "Puzzle Master Trophy":
          criteria = {
            type: "puzzle_completion",
            conditions: [
              {
                field: "totalPuzzlesCompleted",
                operator: "gte",
                value: 25,
                description: "Complete at least 25 puzzles",
              },
            ],
            isRepeatable: false,
          }
          break

        case "Leaderboard Champion":
          criteria = {
            type: "leaderboard_rank",
            conditions: [
              { field: "leaderboardRank", operator: "eq", value: 1, description: "Reach #1 on global leaderboard" },
            ],
            isRepeatable: false,
          }
          break

        case "Speed Demon":
          criteria = {
            type: "special_event",
            conditions: [
              { field: "averageScore", operator: "gte", value: 90, description: "Maintain 90+ average score" },
              {
                field: "totalPuzzlesCompleted",
                operator: "gte",
                value: 10,
                description: "Complete at least 10 puzzles",
              },
            ],
            isRepeatable: false,
          }
          break

        default:
          criteria = {
            type: "manual_award",
            conditions: [],
            isRepeatable: false,
          }
      }

      this.rewardCriteria.set(reward.id, criteria)
    })
  }
}
