import { IsString, IsDateString, IsOptional, IsNumber, IsEnum, MinLength, MaxLength, Min } from "class-validator"
import { EventStatus } from "../entities/event.entity"

export class CreateEventDto {
  @IsString()
  @MinLength(3, { message: "Event title must be at least 3 characters long" })
  @MaxLength(255, { message: "Event title cannot exceed 255 characters" })
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Event description cannot exceed 2000 characters" })
  description?: string

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Max participants cannot be negative" })
  maxParticipants?: number

  @IsOptional()
  metadata?: any
}
