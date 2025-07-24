import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ErrorReportType } from '../enums/error-report-type.enum';

export class CreateErrorReportDto {
  @IsEnum(ErrorReportType)
  type: ErrorReportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
} 