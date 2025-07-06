import { Module } from '@nestjs/common';
import { DraftReviewService } from './draft-review.service';
import { DraftReviewController } from './draft-review.controller';

@Module({
  providers: [DraftReviewService],
  controllers: [DraftReviewController]
})
export class DraftReviewModule {}
