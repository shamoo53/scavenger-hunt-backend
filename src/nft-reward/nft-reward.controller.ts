import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { NftRewardService } from './nft-reward.service';

@Controller('nft-reward')
export class NftRewardController {
  constructor(private readonly nftRewardService: NftRewardService) {}

  @Post('claim')
  async claimReward(
    @Body('userId') userId: number,
    @Body('rewardType') rewardType: string,
    @Body('txHash') txHash: string,
  ) {
    return this.nftRewardService.createReward(userId, rewardType, txHash);
  }

  @Patch(':id/confirm')
  async confirmReward(@Param('id') id: number) {
    await this.nftRewardService.setConfirmed(id, true);
    return { success: true };
  }
}
