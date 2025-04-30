import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"
import type { QuestionDifficulty, QuestionType } from "../question.entity"

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  text: string

  @IsArray()
  @IsString({ each: true })
  options: string[]

  @IsNotEmpty()
  @IsString()
  correctAnswer: string

  @IsOptional()
  @IsEnum(["easy", "medium", "hard"])
  difficulty?: QuestionDifficulty

  @IsOptional()
  @IsEnum(["multiple_choice", "true_false", "open_ended"])
  type?: QuestionType

  @IsOptional()
  @IsString()
  category?: string
}
