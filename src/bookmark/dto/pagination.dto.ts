import { IsOptional, IsNumber, Min, Max } from "class-validator"
import { Transform } from "class-transformer"

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page?: number = 1

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit cannot exceed 100" })
  limit?: number = 10
}

export class PaginatedResponseDto<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data
    const totalPages = Math.ceil(total / limit)

    this.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    }
  }
}
