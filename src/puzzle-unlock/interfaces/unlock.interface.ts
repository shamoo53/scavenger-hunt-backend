export interface UnlockResult {
  success: boolean;
  unlockId?: string;
  message: string;
  remainingTokens?: number;
  expiryTime?: Date;
  metadata?: Record<string, any>;
}

export interface UnlockStatus {
  puzzleId: string;
  isUnlocked: boolean;
  unlockType?: string;
  canUnlock: boolean;
  requirements: UnlockRequirementStatus[];
  attemptsRemaining?: number;
  expiryTime?: Date;
}

export interface UnlockRequirementStatus {
  type: string;
  satisfied: boolean;
  message: string;
  required?: any;
  current?: any;
}
