import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from "class-validator"

export class CreateLevelDto {
  @IsNotEmpty()
  @IsString()
  title: string

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
