import { IsNumber, IsOptional, IsString, Min } from "class-validator"

export class UpdateLeaderboardEntryDto {
  @IsOptional()
  @IsString()
  playerName?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number

  @IsOptional()
  @IsString()
  gameId?: string
}
