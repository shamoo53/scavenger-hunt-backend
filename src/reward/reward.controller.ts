import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateRewardDto, UpdateRewardDto } from 'src/nft-rewards/nft-rewards.controller';

@UseGuards(RolesGuard)
@Controller('admin/rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post()
  create(@Body() dto: CreateRewardDto) {
    return this.rewardService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateRewardDto) {
    return this.rewardService.update(id, dto);
  }

  @Delete
  (':id')
  delete(@Param('id') id: number) {
    return this.rewardService.delete(id);
  }
}