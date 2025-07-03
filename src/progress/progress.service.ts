import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type {
  Puzzle,
  EducationalModule,
  UserPuzzleProgress,
  UserModuleProgress,
  ProgressSummary,
  Achievement,
  ProgressTrackingService,
} from "../interfaces/progress.interface"

@Injectable()
export class ProgressService implements ProgressTrackingService {
  // In-memory storage for demo purposes
  // In production, these would be database repositories
  private puzzles: Map<string, Puzzle> = new Map()
  private modules: Map<string, EducationalModule> = new Map()
  private userPuzzleProgress: Map<string, UserPuzzleProgress[]> = new Map()
  private userModuleProgress: Map<string, UserModuleProgress[]> = new Map()
  private userAchievements: Map<string, Achievement[]> = new Map()

  constructor() {
    this.initializeSampleData()
  }

  // Puzzle Progress Methods
  async startPuzzle(userId: string, puzzleId: string): Promise<UserPuzzleProgress> {
    const puzzle = this.puzzles.get(puzzleId)
    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`)
    }

    const isUnlocked = await this.isPuzzleUnlocked(userId, puzzleId)
    if (!isUnlocked) {
      throw new BadRequestException(`Puzzle ${puzzleId} is not unlocked for user ${userId}`)
    }

    const existingProgress = await this.getPuzzleProgress(userId, puzzleId)
    if (existingProgress && existingProgress.status === "completed") {
      throw new BadRequestException(`Puzzle ${puzzleId} is already completed`)
    }

    const progress: UserPuzzleProgress = {
      userId,
      puzzleId,
      status: "in_progress",
      startedAt: new Date(),
      attempts: existingProgress ? existingProgress.attempts + 1 : 1,
      hints: existingProgress?.hints || [],
    }

    this.updateUserPuzzleProgress(userId, progress)
    return progress
  }

  async completePuzzle(userId: string, puzzleId: string, score?: number): Promise<UserPuzzleProgress> {
    const existingProgress = await this.getPuzzleProgress(userId, puzzleId)
    if (!existingProgress) {
      throw new NotFoundException(`No progress found for puzzle ${puzzleId} and user ${userId}`)
    }

    const completedProgress: UserPuzzleProgress = {
      ...existingProgress,
      status: "completed",
      completedAt: new Date(),
      score,
    }

    this.updateUserPuzzleProgress(userId, completedProgress)

    // Check for new achievements
    await this.checkAndUnlockAchievements(userId)

    return completedProgress
  }

  async getPuzzleProgress(userId: string, puzzleId: string): Promise<UserPuzzleProgress | null> {
    const userProgress = this.userPuzzleProgress.get(userId) || []
    return userProgress.find((p) => p.puzzleId === puzzleId) || null
  }

  async getUserPuzzleProgress(userId: string): Promise<UserPuzzleProgress[]> {
    return this.userPuzzleProgress.get(userId) || []
  }

  // Module Progress Methods
  async startModule(userId: string, moduleId: string): Promise<UserModuleProgress> {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`)
    }

    const isUnlocked = await this.isModuleUnlocked(userId, moduleId)
    if (!isUnlocked) {
      throw new BadRequestException(`Module ${moduleId} is not unlocked for user ${userId}`)
    }

    const existingProgress = await this.getModuleProgress(userId, moduleId)
    if (existingProgress && existingProgress.status === "completed") {
      throw new BadRequestException(`Module ${moduleId} is already completed`)
    }

    const progress: UserModuleProgress = {
      userId,
      moduleId,
      status: "in_progress",
      startedAt: new Date(),
      progress: existingProgress?.progress || 0,
      timeSpent: existingProgress?.timeSpent || 0,
    }

    this.updateUserModuleProgress(userId, progress)
    return progress
  }

  async updateModuleProgress(
    userId: string,
    moduleId: string,
    progress: number,
    timeSpent: number,
  ): Promise<UserModuleProgress> {
    const existingProgress = await this.getModuleProgress(userId, moduleId)
    if (!existingProgress) {
      throw new NotFoundException(`No progress found for module ${moduleId} and user ${userId}`)
    }

    const updatedProgress: UserModuleProgress = {
      ...existingProgress,
      progress: Math.min(100, Math.max(0, progress)),
      timeSpent: existingProgress.timeSpent + timeSpent,
      status: progress >= 100 ? "completed" : "in_progress",
      completedAt: progress >= 100 ? new Date() : undefined,
    }

    this.updateUserModuleProgress(userId, updatedProgress)

    if (updatedProgress.status === "completed") {
      await this.checkAndUnlockAchievements(userId)
    }

    return updatedProgress
  }

  async completeModule(userId: string, moduleId: string): Promise<UserModuleProgress> {
    return this.updateModuleProgress(userId, moduleId, 100, 0)
  }

  async getModuleProgress(userId: string, moduleId: string): Promise<UserModuleProgress | null> {
    const userProgress = this.userModuleProgress.get(userId) || []
    return userProgress.find((p) => p.moduleId === moduleId) || null
  }

  async getUserModuleProgress(userId: string): Promise<UserModuleProgress[]> {
    return this.userModuleProgress.get(userId) || []
  }

  // Unlock Logic Methods
  async getAvailablePuzzles(userId: string): Promise<Puzzle[]> {
    const availablePuzzles: Puzzle[] = []

    for (const puzzle of this.puzzles.values()) {
      const isUnlocked = await this.isPuzzleUnlocked(userId, puzzle.id)
      if (isUnlocked) {
        availablePuzzles.push(puzzle)
      }
    }

    return availablePuzzles
  }

  async isPuzzleUnlocked(userId: string, puzzleId: string): Promise<boolean> {
    const puzzle = this.puzzles.get(puzzleId)
    if (!puzzle) return false

    const userPuzzleProgress = await this.getUserPuzzleProgress(userId)
    const userModuleProgress = await this.getUserModuleProgress(userId)

    // Check if all required puzzles are completed
    for (const requiredPuzzleId of puzzle.unlockCriteria.requiredPuzzles) {
      const requiredProgress = userPuzzleProgress.find((p) => p.puzzleId === requiredPuzzleId)
      if (!requiredProgress || requiredProgress.status !== "completed") {
        return false
      }
    }

    // Check if all required modules are completed
    for (const requiredModuleId of puzzle.unlockCriteria.requiredModules) {
      const requiredProgress = userModuleProgress.find((p) => p.moduleId === requiredModuleId)
      if (!requiredProgress || requiredProgress.status !== "completed") {
        return false
      }
    }

    // Check minimum score requirement
    if (puzzle.unlockCriteria.minimumScore) {
      const completedPuzzles = userPuzzleProgress.filter((p) => p.status === "completed" && p.score !== undefined)
      const averageScore =
        completedPuzzles.length > 0
          ? completedPuzzles.reduce((sum, p) => sum + (p.score || 0), 0) / completedPuzzles.length
          : 0

      if (averageScore < puzzle.unlockCriteria.minimumScore) {
        return false
      }
    }

    return true
  }

  async isModuleUnlocked(userId: string, moduleId: string): Promise<boolean> {
    const module = this.modules.get(moduleId)
    if (!module) return false

    const userPuzzleProgress = await this.getUserPuzzleProgress(userId)
    const userModuleProgress = await this.getUserModuleProgress(userId)

    // Check prerequisites
    for (const prerequisiteId of module.prerequisites) {
      // Check if prerequisite is a puzzle
      if (this.puzzles.has(prerequisiteId)) {
        const puzzleProgress = userPuzzleProgress.find((p) => p.puzzleId === prerequisiteId)
        if (!puzzleProgress || puzzleProgress.status !== "completed") {
          return false
        }
      }

      // Check if prerequisite is a module
      if (this.modules.has(prerequisiteId)) {
        const moduleProgress = userModuleProgress.find((p) => p.moduleId === prerequisiteId)
        if (!moduleProgress || moduleProgress.status !== "completed") {
          return false
        }
      }
    }

    return true
  }

  async getNextUnlockRequirements(userId: string): Promise<any[]> {
    const requirements: any[] = []
    const userPuzzleProgress = await this.getUserPuzzleProgress(userId)
    const userModuleProgress = await this.getUserModuleProgress(userId)

    for (const puzzle of this.puzzles.values()) {
      const isUnlocked = await this.isPuzzleUnlocked(userId, puzzle.id)
      const isCompleted = userPuzzleProgress.some((p) => p.puzzleId === puzzle.id && p.status === "completed")

      if (!isUnlocked && !isCompleted) {
        const missingPuzzles = puzzle.unlockCriteria.requiredPuzzles.filter((reqId) => {
          const progress = userPuzzleProgress.find((p) => p.puzzleId === reqId)
          return !progress || progress.status !== "completed"
        })

        const missingModules = puzzle.unlockCriteria.requiredModules.filter((reqId) => {
          const progress = userModuleProgress.find((p) => p.moduleId === reqId)
          return !progress || progress.status !== "completed"
        })

        if (missingPuzzles.length > 0 || missingModules.length > 0) {
          requirements.push({
            puzzleId: puzzle.id,
            requirements: {
              missingPuzzles,
              missingModules,
              currentScore: this.calculateAverageScore(userPuzzleProgress),
              requiredScore: puzzle.unlockCriteria.minimumScore,
            },
          })
        }
      }
    }

    return requirements
  }

  // Progress Summary
  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const userPuzzleProgress = await this.getUserPuzzleProgress(userId)
    const userModuleProgress = await this.getUserModuleProgress(userId)
    const availablePuzzles = await this.getAvailablePuzzles(userId)
    const nextUnlockRequirements = await this.getNextUnlockRequirements(userId)
    const achievements = await this.getUserAchievements(userId)

    const completedPuzzles = userPuzzleProgress.filter((p) => p.status === "completed")
    const completedModules = userModuleProgress.filter((p) => p.status === "completed")

    const totalPuzzles = this.puzzles.size
    const totalModules = this.modules.size
    const completionPercentage = Math.round(
      ((completedPuzzles.length + completedModules.length) / (totalPuzzles + totalModules)) * 100,
    )

    return {
      userId,
      completedPuzzles,
      completedModules,
      availablePuzzles,
      nextUnlockRequirements,
      overallProgress: {
        totalPuzzles,
        completedPuzzles: completedPuzzles.length,
        totalModules,
        completedModules: completedModules.length,
        completionPercentage,
      },
      achievements,
    }
  }

  // Achievement Methods
  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const newAchievements: Achievement[] = []
    const userAchievements = await this.getUserAchievements(userId)
    const userPuzzleProgress = await this.getUserPuzzleProgress(userId)
    const userModuleProgress = await this.getUserModuleProgress(userId)

    const completedPuzzles = userPuzzleProgress.filter((p) => p.status === "completed")
    const completedModules = userModuleProgress.filter((p) => p.status === "completed")

    // First puzzle completion
    if (completedPuzzles.length === 1 && !userAchievements.some((a) => a.id === "first_puzzle")) {
      const achievement: Achievement = {
        id: "first_puzzle",
        title: "First Steps",
        description: "Complete your first puzzle",
        icon: "🧩",
        unlockedAt: new Date(),
        criteria: "Complete 1 puzzle",
      }
      newAchievements.push(achievement)
    }

    // First module completion
    if (completedModules.length === 1 && !userAchievements.some((a) => a.id === "first_module")) {
      const achievement: Achievement = {
        id: "first_module",
        title: "Knowledge Seeker",
        description: "Complete your first educational module",
        icon: "📚",
        unlockedAt: new Date(),
        criteria: "Complete 1 educational module",
      }
      newAchievements.push(achievement)
    }

    // Puzzle master (complete 5 puzzles)
    if (completedPuzzles.length >= 5 && !userAchievements.some((a) => a.id === "puzzle_master")) {
      const achievement: Achievement = {
        id: "puzzle_master",
        title: "Puzzle Master",
        description: "Complete 5 puzzles",
        icon: "🏆",
        unlockedAt: new Date(),
        criteria: "Complete 5 puzzles",
      }
      newAchievements.push(achievement)
    }

    // Update user achievements
    if (newAchievements.length > 0) {
      const existingAchievements = this.userAchievements.get(userId) || []
      this.userAchievements.set(userId, [...existingAchievements, ...newAchievements])
    }

    return newAchievements
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.userAchievements.get(userId) || []
  }

  // Private helper methods
  private updateUserPuzzleProgress(userId: string, progress: UserPuzzleProgress): void {
    const userProgress = this.userPuzzleProgress.get(userId) || []
    const existingIndex = userProgress.findIndex((p) => p.puzzleId === progress.puzzleId)

    if (existingIndex >= 0) {
      userProgress[existingIndex] = progress
    } else {
      userProgress.push(progress)
    }

    this.userPuzzleProgress.set(userId, userProgress)
  }

  private updateUserModuleProgress(userId: string, progress: UserModuleProgress): void {
    const userProgress = this.userModuleProgress.get(userId) || []
    const existingIndex = userProgress.findIndex((p) => p.moduleId === progress.moduleId)

    if (existingIndex >= 0) {
      userProgress[existingIndex] = progress
    } else {
      userProgress.push(progress)
    }

    this.userModuleProgress.set(userId, userProgress)
  }

  private calculateAverageScore(puzzleProgress: UserPuzzleProgress[]): number {
    const completedWithScores = puzzleProgress.filter((p) => p.status === "completed" && p.score !== undefined)
    if (completedWithScores.length === 0) return 0

    return completedWithScores.reduce((sum, p) => sum + (p.score || 0), 0) / completedWithScores.length
  }

  private initializeSampleData(): void {
    // Sample puzzles
    const puzzle1: Puzzle = {
      id: "puzzle_1",
      title: "NFT Basics",
      description: "Learn the fundamentals of NFTs",
      difficulty: "easy",
      prerequisites: [],
      unlockCriteria: {
        requiredPuzzles: [],
        requiredModules: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const puzzle2: Puzzle = {
      id: "puzzle_2",
      title: "Blockchain Fundamentals",
      description: "Understanding blockchain technology",
      difficulty: "medium",
      prerequisites: ["puzzle_1"],
      educationalModuleId: "module_1",
      unlockCriteria: {
        requiredPuzzles: ["puzzle_1"],
        requiredModules: ["module_1"],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const puzzle3: Puzzle = {
      id: "puzzle_3",
      title: "Advanced NFT Trading",
      description: "Master NFT trading strategies",
      difficulty: "hard",
      prerequisites: ["puzzle_2"],
      unlockCriteria: {
        requiredPuzzles: ["puzzle_1", "puzzle_2"],
        requiredModules: ["module_1", "module_2"],
        minimumScore: 80,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.puzzles.set(puzzle1.id, puzzle1)
    this.puzzles.set(puzzle2.id, puzzle2)
    this.puzzles.set(puzzle3.id, puzzle3)

    // Sample modules
    const module1: EducationalModule = {
      id: "module_1",
      title: "Introduction to NFTs",
      description: "Learn what NFTs are and how they work",
      content: "Comprehensive guide to NFT basics...",
      estimatedDuration: 30,
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const module2: EducationalModule = {
      id: "module_2",
      title: "NFT Marketplaces",
      description: "Understanding different NFT marketplaces",
      content: "Guide to popular NFT marketplaces...",
      estimatedDuration: 45,
      prerequisites: ["module_1"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.modules.set(module1.id, module1)
    this.modules.set(module2.id, module2)
  }
}
