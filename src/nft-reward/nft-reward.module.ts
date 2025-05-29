import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftRewardConfirmationService } from './nft-reward-confirmation.service';
import { NftReward } from './nft-reward.entity';
import { NftRewardController } from './nft-reward.controller';
import { NftRewardService } from './nft-reward.service';

@Module({
  imports: [TypeOrmModule.forFeature([NftReward])],
  providers: [NftRewardService, NftRewardConfirmationService],
  controllers: [NftRewardController],
  exports: [NftRewardService],
})
export class NftRewardModule {}
