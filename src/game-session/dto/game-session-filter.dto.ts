import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator"
import { PaginationDto } from "../../common/dto/pagination.dto"
import { GameSessionStatus } from "../game-session.entity"

export class GameSessionFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  playerId?: string

  @IsOptional()
  @IsString()
  gameId?: string

  @IsOptional()
  @IsEnum(GameSessionStatus)
  status?: GameSessionStatus

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt"

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC"
}
