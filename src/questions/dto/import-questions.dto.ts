import { IsArray, IsNotEmpty, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { CreateQuestionDto } from "./create-question.dto"

export class ImportQuestionsDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[]
}
