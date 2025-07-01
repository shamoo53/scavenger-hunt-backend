import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from "class-validator"
import { Transform } from "class-transformer"

export class RegisterDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  password: string

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40,64}$/, {
    message: "Please provide a valid StarkNet wallet address",
  })
  @Transform(({ value }) => value?.toLowerCase())
  walletAddress: string

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  @MaxLength(30, { message: "Username must not exceed 30 characters" })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and hyphens",
  })
  username?: string
}

export class LoginDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string
}

export class WalletAuthDto {
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40,64}$/, {
    message: "Please provide a valid StarkNet wallet address",
  })
  @Transform(({ value }) => value?.toLowerCase())
  walletAddress: string

  @IsString()
  @MinLength(1, { message: "Signature is required" })
  signature: string

  @IsString()
  @MinLength(1, { message: "Message is required" })
  message: string

  @IsString()
  @MinLength(1, { message: "Nonce is required" })
  nonce: string
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: "Reset token is required" })
  token: string

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  newPassword: string
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: "Current password is required" })
  currentPassword: string

  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters long" })
  @MaxLength(128, { message: "New password must not exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  newPassword: string
}
