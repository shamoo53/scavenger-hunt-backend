import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ReferralCodeService } from './referral-code.service';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { TrackReferralCodeDto } from './dto/track-referral-code.dto';

@Controller('referral-code')
export class ReferralCodeController {
  constructor(private readonly referralCodeService: ReferralCodeService) {}

  @Post('generate')
  async generate(@Body() createDto: CreateReferralCodeDto) {
    return this.referralCodeService.generateReferralCode(createDto);
  }

  @Post('track')
  async track(@Body() trackDto: TrackReferralCodeDto) {
    return this.referralCodeService.trackReferralUsage(trackDto);
  }

  @Get(':code')
  async get(@Param('code') code: string) {
    return this.referralCodeService.getReferralCode(code);
  }
}
