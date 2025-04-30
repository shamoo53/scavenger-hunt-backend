import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator"
import type { QuestionDifficulty, QuestionType } from "../question.entity"

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[]

  @IsOptional()
  @IsString()
  correctAnswer?: string

  @IsOptional()
  @IsEnum(["easy", "medium", "hard"])
  difficulty?: QuestionDifficulty

  @IsOptional()
  @IsEnum(["multiple_choice", "true_false", "open_ended"])
  type?: QuestionType

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
