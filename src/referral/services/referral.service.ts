import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ReferralEntity } from '../entities/referral.entity';
import { RegisterReferralDto } from '../dto/register-referral.dto';
import { customAlphabet } from 'nanoid';

@Injectable()
export class ReferralService {
  private readonly generateCode: () => string;

  constructor(
    @InjectRepository(ReferralEntity)
    private referralRepository: Repository<ReferralEntity>,
  ) {
    // Generate referral codes using numbers and uppercase letters
    this.generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
  }

  async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let exists: boolean;
    do {
      code = this.generateCode();
      exists = await this.referralRepository.exist({ where: { referralCode: code } });
    } while (exists);
    return code;
  }

  async registerReferral(dto: RegisterReferralDto): Promise<ReferralEntity> {
    const { userId, referralCode, ipAddress, userAgent } = dto;

    // Check if user already has a referral code
    const existingReferral = await this.referralRepository.findOne({
      where: { userId },
    });

    if (existingReferral) {
      throw new ConflictException('User already has a referral code');
    }

    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await this.referralRepository.findOne({
        where: { referralCode },
      });

      if (!referrer) {
        throw new NotFoundException('Invalid referral code');
      }

      referredBy = referrer.userId;
      // Increment referrer's count
      await this.referralRepository.increment(
        { id: referrer.id },
        'referralCount',
        1,
      );
    }

    const newReferral = this.referralRepository.create({
      userId,
      referralCode: await this.generateUniqueReferralCode(),
      referredBy,
      metadata: {
        ipAddress,
        userAgent,
        referralDate: new Date(),
      },
    });

    return this.referralRepository.save(newReferral);
  }

  async getReferralStats(userId: string) {
    const referral = await this.referralRepository.findOne({
      where: { userId },
    });

    if (!referral) {
      throw new NotFoundException('User not found');
    }

    const referredUsers = await this.referralRepository.find({
      where: { referredBy: userId },
      select: ['userId', 'createdAt'],
    });

    return {
      userId,
      referralCode: referral.referralCode,
      totalReferrals: referral.referralCount,
      referredUsers: referredUsers.map(user => ({
        userId: user.userId,
        joinedAt: user.createdAt,
      })),
    };
  }

  async getLeaderboard(limit: number = 10) {
    return this.referralRepository.find({
      where: { referralCount: MoreThan(0) },
      order: { referralCount: 'DESC' },
      take: limit,
      select: ['userId', 'referralCount'],
    });
  }
}