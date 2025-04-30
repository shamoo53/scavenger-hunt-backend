import { IsOptional, IsString, IsNumber, IsBoolean } from "class-validator"

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  order?: number

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean
}
