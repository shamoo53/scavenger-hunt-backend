import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"

export class CreateLeaderboardEntryDto {
  @IsNotEmpty()
  @IsString()
  playerName: string

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number

  @IsOptional()
  @IsString()
  gameId?: string
}
