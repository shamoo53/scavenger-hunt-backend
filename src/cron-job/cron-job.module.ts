import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CronJobController } from './cron-job.controller';

@Module({
  controllers: [CronJobController],
  providers: [CronJobService],
})
export class CronJobModule {}
