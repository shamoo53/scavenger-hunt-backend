
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePuzzleTimerDto {
  @IsDateString()
  @IsNotEmpty()
  readonly startTime: string;

  @IsDateString()
  @IsNotEmpty()
  readonly endTime: string;

  @IsUUID()
  @IsNotEmpty()
  readonly challengeId: string;
}