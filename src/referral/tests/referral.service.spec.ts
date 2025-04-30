import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralService } from '../services/referral.service';
import { ReferralEntity } from '../entities/referral.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ReferralService', () => {
  let service: ReferralService;
  let repository: Repository<ReferralEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    exist: jest.fn(),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(ReferralEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    repository = module.get<Repository<ReferralEntity>>(getRepositoryToken(ReferralEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUniqueReferralCode', () => {
    it('should generate a unique 8-character code', async () => {
      mockRepository.exist.mockResolvedValueOnce(false);
      const code = await service.generateUniqueReferralCode();
      expect(code).toMatch(/^[0-9A-Z]{8}$/);
    });

    it('should retry if generated code already exists', async () => {
      mockRepository.exist
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      const code = await service.generateUniqueReferralCode();
      expect(mockRepository.exist).toHaveBeenCalledTimes(2);
      expect(code).toMatch(/^[0-9A-Z]{8}$/);
    });
  });

  describe('registerReferral', () => {
    const mockDto = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      referralCode: 'ABC12345',
      ipAddress: '127.0.0.1',
    };

    it('should register a new referral without referral code', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce({
        ...mockDto,
        referralCode: 'XYZ98765',
      });
      mockRepository.save.mockResolvedValueOnce({
        ...mockDto,
        referralCode: 'XYZ98765',
      });

      const result = await service.registerReferral(mockDto);
      expect(result.referralCode).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already has a referral', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ userId: mockDto.userId });
      await expect(service.registerReferral(mockDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for invalid referral code', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // User doesn't exist
        .mockResolvedValueOnce(null); // Referral code doesn't exist
      await expect(service.registerReferral(mockDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReferralStats', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return referral stats for existing user', async () => {
      const mockReferral = {
        userId,
        referralCode: 'ABC12345',
        referralCount: 2,
      };
      const mockReferredUsers = [
        { userId: 'user1', createdAt: new Date() },
        { userId: 'user2', createdAt: new Date() },
      ];

      mockRepository.findOne.mockResolvedValueOnce(mockReferral);
      mockRepository.find.mockResolvedValueOnce(mockReferredUsers);

      const result = await service.getReferralStats(userId);
      expect(result.totalReferrals).toBe(2);
      expect(result.referredUsers).toHaveLength(2);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getReferralStats(userId)).rejects.toThrow(NotFoundException);
    });
  });
});