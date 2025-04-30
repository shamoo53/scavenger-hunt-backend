import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateGameSessionDto {
  @IsNotEmpty()
  @IsString()
  playerId: string

  @IsOptional()
  @IsString()
  gameId?: string

  @IsOptional()
  @IsArray()
  questionIds?: number[]

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  metadata?: Record<string, any>
}
