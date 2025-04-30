import { Controller, Post, Get, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReferralService } from '../services/referral.service';
import { RegisterReferralDto } from '../dto/register-referral.dto';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('register')
  async registerReferral(@Body() dto: RegisterReferralDto) {
    const referral = await this.referralService.registerReferral(dto);
    return {
      success: true,
      referralCode: referral.referralCode,
      message: 'Referral registration successful',
    };
  }

  @Get(':userId')
  async getReferralStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.referralService.getReferralStats(userId);
  }

  @Get()
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.referralService.getLeaderboard(limit);
  }
}