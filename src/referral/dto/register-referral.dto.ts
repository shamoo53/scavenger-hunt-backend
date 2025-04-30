import { IsString, IsUUID, IsOptional, IsIP } from 'class-validator';

export class RegisterReferralDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  referralCode?: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}