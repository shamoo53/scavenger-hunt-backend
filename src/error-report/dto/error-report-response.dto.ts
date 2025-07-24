import { ErrorReportStatus } from '../enums/error-report-status.enum';
import { ErrorReportType } from '../enums/error-report-type.enum';

export class ErrorReportResponseDto {
  id: string;
  userId: string;
  type: ErrorReportType;
  description: string;
  status: ErrorReportStatus;
  createdAt: Date;
  updatedAt: Date;
} 