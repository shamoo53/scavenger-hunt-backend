import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorReport } from './entities/error-report.entity';
import { ErrorReportService } from './error-report.service';
import { ErrorReportController } from './error-report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorReport])],
  providers: [ErrorReportService],
  controllers: [ErrorReportController],
})
export class ErrorReportModule {} 