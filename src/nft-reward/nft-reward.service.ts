import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftReward } from './nft-reward.entity';

@Injectable()
export class NftRewardService {
  private readonly logger = new Logger(NftRewardService.name);

  constructor(
    @InjectRepository(NftReward)
    private readonly nftRewardRepository: Repository<NftReward>,
  ) {}

  async createReward(userId: number, rewardType: string, txHash: string): Promise<NftReward> {
    const reward = this.nftRewardRepository.create({ userId, rewardType, txHash });
    return this.nftRewardRepository.save(reward);
  }

  async setConfirmed(id: number, confirmed: boolean): Promise<void> {
    await this.nftRewardRepository.update(id, { confirmed });
  }

  async incrementRetry(id: number): Promise<void> {
    await this.nftRewardRepository.increment({ id }, 'retryCount', 1);
  }

  async findUnconfirmed(): Promise<NftReward[]> {
    return this.nftRewardRepository.find({ where: { confirmed: false } });
  }

  async updateTxHash(id: number, txHash: string): Promise<void> {
    await this.nftRewardRepository.update(id, { txHash });
  }
}
