import { IsString, IsOptional } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateCategoryDto {
  @ApiProperty({ description: "Category name" })
  @IsString()
  name: string

  @ApiProperty({ description: "Category slug for URLs" })
  @IsString()
  slug: string

  @ApiPropertyOptional({ description: "Category description" })
  @IsString()
  @IsOptional()
  description?: string
}
