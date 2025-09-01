import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsUUID,
  IsString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { CreateEventAnnouncementDto } from './create-event-announcement.dto';

export class UpdateEventAnnouncementDto extends PartialType(
  CreateEventAnnouncementDto,
) {
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedByName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;
}
