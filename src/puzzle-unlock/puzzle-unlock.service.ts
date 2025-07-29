import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Unlock, UnlockType, UnlockStatus as UnlockStatusEnum } from './entities/unlock.entity';
import { UnlockRequirement } from './entities/unlock-requirement.entity';
import { CreateUnlockDto } from './dto/create-unlock.dto';
import { UnlockPuzzleDto } from './dto/unlock-puzzle.dto';
import { CreateUnlockRequirementDto } from './dto/create-unlock-requirement.dto';
import { UnlockResult, UnlockStatus, UnlockRequirementStatus } from './interfaces/unlock.interface';

@Injectable()
export class PuzzleUnlockService {
  private readonly logger = new Logger(PuzzleUnlockService.name);

  constructor(
    @InjectRepository(Unlock)
    private readonly unlockRepository: Repository<Unlock>,
    @InjectRepository(UnlockRequirement)
    private readonly requirementRepository: Repository<UnlockRequirement>,
  ) {}

  // Main unlock method
  async unlockPuzzle(unlockDto: UnlockPuzzleDto): Promise<UnlockResult> {
    const { userId, puzzleId, unlockType, unlockKey, tokensToSpend, completedPuzzleId } = unlockDto;

    try {
      // Check if already unlocked
      const existingUnlock = await this.findUnlock(userId, puzzleId);
      if (existingUnlock && existingUnlock.status === UnlockStatusEnum.UNLOCKED) {
        return {
          success: false,
          message: 'Puzzle is already unlocked',
          unlockId: existingUnlock.id
        };
      }

      // Get unlock requirements
      const requirements = await this.getUnlockRequirements(puzzleId);
      const targetRequirement = requirements.find(req => req.unlockType === unlockType);
      
      if (!targetRequirement) {
        throw new BadRequestException(`Unlock type ${unlockType} not available for this puzzle`);
      }

      // Validate unlock attempt
      const validation = await this.validateUnlockAttempt(userId, puzzleId, unlockType, {
        unlockKey,
        tokensToSpend,
        completedPuzzleId,
        requirement: targetRequirement
      });

      if (!validation.canUnlock) {
        return {
          success: false,
          message: validation.reason || 'Cannot unlock puzzle'
        };
      }

      // Process the unlock
      const unlockResult = await this.processUnlock(userId, puzzleId, targetRequirement, {
        unlockKey,
        tokensToSpend,
        completedPuzzleId
      });

      this.logger.log(`Puzzle unlocked: ${puzzleId} for user ${userId} using ${unlockType}`);
      return unlockResult;

    } catch (error) {
      this.logger.error(`Failed to unlock puzzle: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Check unlock status for a puzzle
  async checkUnlockStatus(userId: string, puzzleId: string): Promise<UnlockStatus> {
    const existingUnlock = await this.findUnlock(userId, puzzleId);
    const requirements = await this.getUnlockRequirements(puzzleId);

    if (existingUnlock && existingUnlock.status === UnlockStatusEnum.UNLOCKED) {
      return {
        puzzleId,
        isUnlocked: true,
        unlockType: existingUnlock.unlockType,
        canUnlock: false,
        requirements: [],
        attemptsRemaining: this.calculateRemainingAttempts(existingUnlock),
        expiryTime: existingUnlock.expiryTime
      };
    }

    const requirementStatuses = await Promise.all(
      requirements.map(req => this.checkRequirementStatus(userId, req))
    );

    const canUnlock = requirementStatuses.some(status => status.satisfied);

    return {
      puzzleId,
      isUnlocked: false,
      canUnlock,
      requirements: requirementStatuses,
      attemptsRemaining: existingUnlock ? this.calculateRemainingAttempts(existingUnlock) : undefined
    };
  }

  // Create unlock requirement
  async createUnlockRequirement(createDto: CreateUnlockRequirementDto): Promise<UnlockRequirement> {
    const requirement = this.requirementRepository.create(createDto);
    return this.requirementRepository.save(requirement);
  }

  // Get all unlock requirements for a puzzle
  async getUnlockRequirements(puzzleId: string): Promise<UnlockRequirement[]> {
    return this.requirementRepository.find({
      where: { puzzleId, active: true }
    });
  }

  // Get user's unlocks
  async getUserUnlocks(userId: string, status?: UnlockStatusEnum): Promise<Unlock[]> {
    const where: FindOptionsWhere<Unlock> = { userId };
    if (status) {
      where.status = status;
    }

    return this.unlockRepository.find({ where });
  }

  // Get puzzle unlocks
  async getPuzzleUnlocks(puzzleId: string): Promise<Unlock[]> {
    return this.unlockRepository.find({ where: { puzzleId } });
  }

  // Create manual unlock
  async createUnlock(createDto: CreateUnlockDto): Promise<Unlock> {
    const existingUnlock = await this.findUnlock(createDto.userId, createDto.puzzleId);
    
    if (existingUnlock) {
      throw new ConflictException('Unlock record already exists for this user and puzzle');
    }

    const unlock = this.unlockRepository.create({
      ...createDto,
      unlockTime: createDto.unlockTime ? new Date(createDto.unlockTime) : undefined,
      expiryTime: createDto.expiryTime ? new Date(createDto.expiryTime) : undefined
    });

    return this.unlockRepository.save(unlock);
  }

  // Update unlock status
  async updateUnlockStatus(unlockId: string, status: UnlockStatusEnum): Promise<Unlock> {
    const unlock = await this.unlockRepository.findOne({ where: { id: unlockId } });
    
    if (!unlock) {
      throw new NotFoundException('Unlock record not found');
    }

    unlock.status = status;
    return this.unlockRepository.save(unlock);
  }

  // Private helper methods
  private async findUnlock(userId: string, puzzleId: string): Promise<Unlock | null> {
    return this.unlockRepository.findOne({
      where: { userId, puzzleId }
    });
  }

  private async validateUnlockAttempt(
    userId: string, 
    puzzleId: string, 
    unlockType: UnlockType, 
    options: any
  ): Promise<{ canUnlock: boolean; reason?: string }> {
    const { requirement } = options;

    // Check attempts limit
    const existingUnlock = await this.findUnlock(userId, puzzleId);
    if (existingUnlock && requirement.maxAttempts) {
      if (existingUnlock.attemptsUsed >= requirement.maxAttempts) {
        return { canUnlock: false, reason: 'Maximum attempts exceeded' };
      }
    }

    // Validate based on unlock type
    switch (unlockType) {
      case UnlockType.KEY:
        if (!options.unlockKey || options.unlockKey !== requirement.unlockKey) {
          return { canUnlock: false, reason: 'Invalid unlock key' };
        }
        break;

      case UnlockType.TOKEN:
        if (!options.tokensToSpend || options.tokensToSpend < requirement.tokenCost) {
          return { canUnlock: false, reason: 'Insufficient tokens' };
        }
        // Here you would check user's actual token balance
        break;

      case UnlockType.COMPLETION:
        if (!options.completedPuzzleId || options.completedPuzzleId !== requirement.requiredPuzzleId) {
          return { canUnlock: false, reason: 'Required puzzle not completed' };
        }
        // Here you would verify the puzzle completion
        break;

      case UnlockType.TIME_BASED:
        const now = new Date();
        if (requirement.timeDelayHours) {
          const requiredTime = new Date(existingUnlock?.createdAt || now);
          requiredTime.setHours(requiredTime.getHours() + requirement.timeDelayHours);
          if (now < requiredTime) {
            return { canUnlock: false, reason: 'Time requirement not met' };
          }
        }
        break;
    }

    return { canUnlock: true };
  }

  private async processUnlock(
    userId: string, 
    puzzleId: string, 
    requirement: UnlockRequirement, 
    options: any
  ): Promise<UnlockResult> {
    let unlock = await this.findUnlock(userId, puzzleId);
    
    if (!unlock) {
      unlock = this.unlockRepository.create({
        userId,
        puzzleId,
        unlockType: requirement.unlockType,
        status: UnlockStatusEnum.UNLOCKED,
        unlockKey: requirement.unlockKey,
        tokenCost: requirement.tokenCost,
        requiredPuzzleId: requirement.requiredPuzzleId,
        requiredLevel: requirement.requiredLevel,
        requiredAchievement: requirement.requiredAchievement,
        maxAttempts: requirement.maxAttempts,
        unlockTime: new Date(),
        expiryTime: requirement.expiryHours ? 
          new Date(Date.now() + requirement.expiryHours * 60 * 60 * 1000) : undefined
      });
    } else {
      unlock.status = UnlockStatusEnum.UNLOCKED;
      unlock.unlockTime = new Date();
      unlock.attemptsUsed += 1;
    }

    const savedUnlock = await this.unlockRepository.save(unlock);

    return {
      success: true,
      unlockId: savedUnlock.id,
      message: 'Puzzle unlocked successfully',
      expiryTime: savedUnlock.expiryTime
    };
  }

  private async checkRequirementStatus(userId: string, requirement: UnlockRequirement): Promise<UnlockRequirementStatus> {
    const status: UnlockRequirementStatus = {
      type: requirement.unlockType,
      satisfied: false,
      message: ''
    };

    switch (requirement.unlockType) {
      case UnlockType.TOKEN:
        status.required = requirement.tokenCost;
        // You would check user's actual token balance here
        status.current = 0; // Placeholder
        status.satisfied = status.current >= status.required;
        status.message = status.satisfied ? 
          `Has ${status.current} tokens (need ${status.required})` :
          `Need ${status.required} tokens (have ${status.current})`;
        break;

      case UnlockType.KEY:
        status.satisfied = true; // Key can always be used if provided
        status.message = 'Requires unlock key';
        break;

      case UnlockType.COMPLETION:
        // You would check if required puzzle is completed here
        status.satisfied = false; // Placeholder
        status.message = `Requires completion of puzzle: ${requirement.requiredPuzzleId}`;
        break;

      case UnlockType.LEVEL_BASED:
        status.required = requirement.requiredLevel;
        // You would check user's actual level here
        status.current = 1; // Placeholder
        status.satisfied = status.current >= status.required;
        status.message = `Requires level ${status.required} (current: ${status.current})`;
        break;

      case UnlockType.TIME_BASED:
        status.satisfied = true; // Time-based can be satisfied immediately or after delay
        status.message = requirement.timeDelayHours ? 
          `Available after ${requirement.timeDelayHours} hours` : 
          'Available immediately';
        break;

      default:
        status.message = 'Unknown requirement type';
    }

    return status;
  }

  private calculateRemainingAttempts(unlock: Unlock): number | undefined {
    if (!unlock.maxAttempts) return undefined;
    return Math.max(0, unlock.maxAttempts - unlock.attemptsUsed);
  }
}