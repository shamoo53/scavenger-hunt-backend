export interface AttemptRecord {
  userId: string;
  timestamp: Date;
  isCorrect: boolean;
  questionId?: string;
  ipAddress?: string;
}

export interface UserAbuseStats {
  userId: string;
  totalAttempts: number;
  wrongAttempts: number;
  lastAttemptTime: Date;
  isBlocked: boolean;
  blockExpiresAt?: Date;
  flaggedForAdmin: boolean;
}

export interface AbuseDetectionConfig {
  maxAttemptsPerMinute: number;
  maxWrongAnswersInRow: number;
  blockDurationMinutes: number;
  adminFlagThreshold: number;
}