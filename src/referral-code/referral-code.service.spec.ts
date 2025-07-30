import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralCodeService } from './referral-code.service';
import { ReferralCode } from './entities/referral-code.entity';
import { Repository } from 'typeorm';

const mockReferralCodeRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('ReferralCodeService', () => {
  let service: ReferralCodeService;
  let repo: Repository<ReferralCode>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCodeService,
        {
          provide: getRepositoryToken(ReferralCode),
          useFactory: mockReferralCodeRepository,
        },
      ],
    }).compile();

    service = module.get<ReferralCodeService>(ReferralCodeService);
    repo = module.get<Repository<ReferralCode>>(getRepositoryToken(ReferralCode));
  });

  it('should generate a referral code', async () => {
    (repo.create as any).mockReturnValue({ code: 'ABC12345', ownerId: 1, usageCount: 0 });
    (repo.save as any).mockResolvedValue({ code: 'ABC12345', ownerId: 1, usageCount: 0 });
    const result = await service.generateReferralCode({ ownerId: 1 });
    expect(result.code).toBeDefined();
    expect(result.ownerId).toBe(1);
    expect(result.usageCount).toBe(0);
  });

  it('should track referral usage', async () => {
    (repo.findOne as any).mockResolvedValue({ code: 'ABC12345', ownerId: 1, usageCount: 0 });
    (repo.save as any).mockResolvedValue({ code: 'ABC12345', ownerId: 1, usageCount: 1 });
    const result = await service.trackReferralUsage({ code: 'ABC12345', invitedUserId: 2 });
    expect(result.usageCount).toBe(1);
  });

  it('should throw NotFoundException for invalid code', async () => {
    (repo.findOne as any).mockResolvedValue(undefined);
    await expect(service.trackReferralUsage({ code: 'INVALID', invitedUserId: 2 })).rejects.toThrow('Referral code not found');
  });

  it('should get referral code by code', async () => {
    (repo.findOne as any).mockResolvedValue({ code: 'ABC12345', ownerId: 1, usageCount: 0 });
    const result = await service.getReferralCode('ABC12345');
    expect(result.code).toBe('ABC12345');
  });

  it('should throw NotFoundException when getting non-existent code', async () => {
    (repo.findOne as any).mockResolvedValue(undefined);
    await expect(service.getReferralCode('INVALID')).rejects.toThrow('Referral code not found');
  });
});
