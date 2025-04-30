import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from "class-validator"

export class QuestionFeedbackDto {
  @IsNumber()
  @Min(0)
  @Max(10000)
  timeToAnswerMs: number

  @IsBoolean()
  wasCorrect: boolean

  @IsOptional()
  @IsBoolean()
  liked?: boolean

  @IsOptional()
  @IsString()
  feedback?: string
}
