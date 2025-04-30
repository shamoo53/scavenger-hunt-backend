import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator"

export class AnswerQuestionDto {
  @IsNotEmpty()
  @IsString()
  selectedAnswer: string

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  timeToAnswerMs: number
}
