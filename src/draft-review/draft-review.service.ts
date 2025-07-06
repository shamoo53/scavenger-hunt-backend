import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DraftReview } from './entities/draft-review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class DraftReviewService {
  constructor(
    @InjectRepository(DraftReview)
    private reviewRepo: Repository<DraftReview>,
  ) {}

  async submitOrUpdateReview(draftId: number, reviewerId: number, dto: CreateReviewDto) {
    const existing = await this.reviewRepo.findOne({ where: { draftId, reviewerId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.reviewRepo.save(existing);
    }
    const review = this.reviewRepo.create({ draftId, reviewerId, ...dto });
    return this.reviewRepo.save(review);
  }

  async getPendingDrafts() {
    return this.reviewRepo.find({ where: { status: 'pending' } });
  }
}
