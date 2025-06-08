import { Module } from '@nestjs/common';
import { AbuseDetectionService } from './abuse-detection.service';
import { AbuseDetectionController } from './abuse-detection.controller';

@Module({
  controllers: [AbuseDetectionController],
  providers: [AbuseDetectionService],
})
export class AbuseDetectionModule {}
