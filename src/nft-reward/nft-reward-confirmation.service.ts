import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NftRewardService } from './nft-reward.service';

// You should replace this with a real web3/ethers provider in production
async function checkOnChainConfirmation(txHash: string): Promise<boolean> {
  // Simulate on-chain check (replace with actual logic)
  return Math.random() > 0.2; // 80% chance to succeed
}

@Injectable()
export class NftRewardConfirmationService implements OnModuleInit {
  private readonly logger = new Logger(NftRewardConfirmationService.name);
  private readonly interval = 60 * 1000; // 1 minute
  private timer: NodeJS.Timeout;

  constructor(private readonly nftRewardService: NftRewardService) {}

  async onModuleInit() {
    this.startConfirmationLoop();
  }

  private startConfirmationLoop() {
    this.timer = setInterval(() => this.confirmUnconfirmedRewards(), this.interval);
  }

  private async confirmUnconfirmedRewards() {
    const rewards = await this.nftRewardService.findUnconfirmed();
    for (const reward of rewards) {
      if (!reward.txHash) continue;
      try {
        const confirmed = await checkOnChainConfirmation(reward.txHash);
        if (confirmed) {
          await this.nftRewardService.setConfirmed(reward.id, true);
          this.logger.log(`Reward ${reward.id} confirmed on-chain.`);
        } else {
          await this.nftRewardService.incrementRetry(reward.id);
          this.logger.warn(`Reward ${reward.id} not yet confirmed. Retrying...`);
        }
      } catch (err) {
        this.logger.error(`Error confirming reward ${reward.id}:`, err);
        await this.nftRewardService.incrementRetry(reward.id);
      }
    }
  }
}
