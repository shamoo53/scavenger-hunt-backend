import { IsString, MinLength, MaxLength, IsOptional } from "class-validator"

export class UpdateExplanationDto {
  @IsOptional()
  @IsString()
  @MinLength(10, { message: "Explanation must be at least 10 characters long" })
  @MaxLength(5000, { message: "Explanation cannot exceed 5000 characters" })
  text?: string
}
