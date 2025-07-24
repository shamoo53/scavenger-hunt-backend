import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorReport } from './entities/error-report.entity';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { ErrorReportResponseDto } from './dto/error-report-response.dto';


@Injectable()
export class ErrorReportService {
  constructor(
    @InjectRepository(ErrorReport)
    private readonly errorReportRepository: Repository<ErrorReport>,
  ) {}

  async submitReport(userId: string, dto: CreateErrorReportDto): Promise<ErrorReportResponseDto> {
    const report = this.errorReportRepository.create({
      userId,
      ...dto,
    });
    const saved = await this.errorReportRepository.save(report);
    return this.toResponseDto(saved);
  }

  async getReports(): Promise<ErrorReportResponseDto[]> {
    const reports = await this.errorReportRepository.find();
    return reports.map(this.toResponseDto);
  }

  async getReportById(id: string): Promise<ErrorReportResponseDto> {
    const report = await this.errorReportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Error report not found');
    return this.toResponseDto(report);
  }

  private toResponseDto(report: ErrorReport): ErrorReportResponseDto {
    const { id, userId, type, description, status, createdAt, updatedAt } = report;
    return { id, userId, type, description, status, createdAt, updatedAt };
  }
} 