import { Module } from "@nestjs/common"
import { NFTRewardsServiceImpl } from "./nft-rewards.service"
import { NFTRewardsController } from "./nft-rewards.controller"

@Module({
  providers: [NFTRewardsServiceImpl],
  controllers: [NFTRewardsController],
  exports: [NFTRewardsServiceImpl],
})
export class NFTRewardsModule {}
