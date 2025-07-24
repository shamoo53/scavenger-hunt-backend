import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ErrorReportType } from '../enums/error-report-type.enum';
import { ErrorReportStatus } from '../enums/error-report-status.enum';

@Entity('error_reports')
export class ErrorReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ErrorReportType })
  type: ErrorReportType;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ErrorReportStatus, default: ErrorReportStatus.OPEN })
  status: ErrorReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 