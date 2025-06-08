import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  questionId?: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}

export class AdminFlagDto {
  @IsUUID()
  userId: string;

  @IsString()
  reason: string;
}
