import { IsString, IsOptional, IsEnum, IsUUID, IsArray, MinLength, MaxLength } from "class-validator"
import { PuzzleDifficulty, PuzzleStatus } from "../entities/puzzle.entity"

export class CreatePuzzleDto {
  @IsString()
  @MinLength(3, { message: "Puzzle title must be at least 3 characters long" })
  @MaxLength(255, { message: "Puzzle title cannot exceed 255 characters" })
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Puzzle description cannot exceed 2000 characters" })
  description?: string

  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty

  @IsOptional()
  @IsEnum(PuzzleStatus)
  status?: PuzzleStatus

  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  content?: any

  @IsOptional()
  solution?: any

  @IsUUID()
  createdBy: string
}
