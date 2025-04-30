import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator"
import { Transform, Type } from "class-transformer"
import { PaginationDto } from "../../common/dto/pagination.dto"
import type { QuestionDifficulty, QuestionType } from "../question.entity"

export class QuestionsFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

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
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  tags?: string[]

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minUsage?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  maxUsage?: number

  @IsOptional()
  @IsString()
  authorId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt"

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC"
}
