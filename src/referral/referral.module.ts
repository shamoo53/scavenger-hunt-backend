import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralEntity } from './entities/referral.entity';
import { ReferralService } from './services/referral.service';
import { ReferralController } from './controllers/referral.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralEntity]),
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService], // Export the service in case other modules need it
})
export class ReferralModule {}