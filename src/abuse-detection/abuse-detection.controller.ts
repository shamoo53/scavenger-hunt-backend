import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AbuseDetectionService } from './abuse-detection.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('abuse-detection')
export class AbuseDetectionController {
  constructor(private readonly abuseDetectionService: AbuseDetectionService) {}

  @Post('record-attempt')
  async recordAttempt(@Body() submitAnswerDto: SubmitAnswerDto) {
    return this.abuseDetectionService.recordAttempt(submitAnswerDto);
  }

  @Get('user/:userId/blocked')
  async isUserBlocked(@Param('userId') userId: string) {
    const blocked = await this.abuseDetectionService.isUserBlocked(userId);
    return { userId, blocked };
  }

  @Get('user/:userId/stats')
  async getUserStats(@Param('userId') userId: string) {
    return this.abuseDetectionService.getUserAbuseStats(userId);
  }

  // Admin endpoints
  @Get('admin/flagged-users')
  // @UseGuards(AdminGuard) // Implement your admin guard
  async getFlaggedUsers() {
    return this.abuseDetectionService.getFlaggedUsers();
  }

  @Patch('admin/user/:userId/unblock')
  // @UseGuards(AdminGuard)
  async unblockUser(@Param('userId') userId: string) {
    await this.abuseDetectionService.unblockUser(userId);
    return { message: `User ${userId} has been unblocked` };
  }

  @Patch('admin/user/:userId/clear-flag')
  // @UseGuards(AdminGuard)
  async clearUserFlag(@Param('userId') userId: string) {
    await this.abuseDetectionService.clearUserFlag(userId);
    return { message: `Flag cleared for user ${userId}` };
  }
}