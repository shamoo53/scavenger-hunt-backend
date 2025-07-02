import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common"
import { Repository } from "typeorm"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { CryptoService } from "./crypto.service"

import {
  RegisterDto,
  LoginDto,
  WalletAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto"
import { AuthResponse, JwtPayload } from "../../interfaces/jwt-payload.interface"
import { User, UserStatus } from "src/user/entities/user.entity"
import { WalletService } from "./wallet.service"
import { EmailService } from "./email.service"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly maxLoginAttempts = 5
  private readonly lockoutDuration = 15 * 60 * 1000 
  private readonly passwordResetExpiry = 60 * 60 * 1000 

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private walletService: WalletService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, walletAddress, username } = registerDto

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { walletAddress }],
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException("Email already registered")
      }
      if (existingUser.walletAddress === walletAddress) {
        throw new ConflictException("Wallet address already registered")
      }
    }

    // Check username uniqueness if provided
    if (username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      })
      if (existingUsername) {
        throw new ConflictException("Username already taken")
      }
    }

    // Validate wallet address format
    if (!this.walletService.isValidWalletAddress(walletAddress)) {
      throw new BadRequestException("Invalid wallet address format")
    }

    // Hash password
    const hashedPassword = await this.cryptoService.hashPassword(password)

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      walletAddress,
      username,
      emailVerificationToken: this.cryptoService.generateRandomToken(),
    })

    const savedUser = await this.userRepository.save(user)

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, username)
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${email}:`, error)
    }

    // Generate tokens
    const tokens = await this.generateTokens(savedUser)

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        walletAddress: savedUser.walletAddress,
        username: savedUser.username,
        role: savedUser.role,
        emailVerified: savedUser.emailVerified,
      },
      ...tokens,
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto

    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException("Invalid credentials")
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException(`Account is locked until ${user.lockedUntil.toISOString()}`)
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active")
    }

    // Verify password
    const isPasswordValid = await this.cryptoService.comparePassword(password, user.password)

    if (!isPasswordValid) {
      await this.handleFailedLogin(user)
      throw new UnauthorizedException("Invalid credentials")
    }

    // Reset login attempts on successful login
    await this.resetLoginAttempts(user)

    // Update last login
    user.lastLoginAt = new Date()
    await this.userRepository.save(user)

    // Generate tokens
    const tokens = await this.generateTokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    }
  }

  async walletAuth(walletAuthDto: WalletAuthDto): Promise<AuthResponse> {
    const { walletAddress, signature, message, nonce } = walletAuthDto

    // Find user by wallet address
    const user = await this.userRepository.findOne({
      where: { walletAddress },
    })

    if (!user) {
      throw new UnauthorizedException("Wallet not registered")
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active")
    }

    // Verify signature
    const isSignatureValid = await this.walletService.verifySignature(walletAddress, message, signature, nonce)

    if (!isSignatureValid) {
      throw new UnauthorizedException("Invalid wallet signature")
    }

    // Update last login
    user.lastLoginAt = new Date()
    await this.userRepository.save(user)

    // Generate tokens
    const tokens = await this.generateTokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto

    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      // Don't reveal if email exists or not
      return
    }

    // Generate reset token
    const resetToken = this.cryptoService.generateRandomToken()
    const resetExpires = new Date(Date.now() + this.passwordResetExpiry)

    // Save reset token
    user.passwordResetToken = resetToken
    user.passwordResetExpires = resetExpires
    await this.userRepository.save(user)

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken)
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error)
      throw new BadRequestException("Failed to send password reset email")
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    })

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException("Invalid or expired reset token")
    }

    // Hash new password
    const hashedPassword = await this.cryptoService.hashPassword(newPassword)

    // Update password and clear reset token
    user.password = hashedPassword
    user.passwordResetToken = null
    user.passwordResetExpires = null
    user.loginAttempts = 0
    user.lockedUntil = null

    await this.userRepository.save(user)
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto

    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Verify current password
    const isCurrentPasswordValid = await this.cryptoService.comparePassword(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect")
    }

    // Hash new password
    const hashedPassword = await this.cryptoService.hashPassword(newPassword)

    // Update password
    user.password = hashedPassword
    await this.userRepository.save(user)
  }

  async generateWalletAuthMessage(walletAddress: string): Promise<{ message: string; nonce: string }> {
    const nonce = this.cryptoService.generateNonce()
    const message = this.walletService.generateAuthMessage(walletAddress, nonce)

    return { message, nonce }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get("JWT_EXPIRES_IN", "15m"),
    })

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN", "7d"),
    })

    return { accessToken, refreshToken }
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts += 1

    if (user.loginAttempts >= this.maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + this.lockoutDuration)
    }

    await this.userRepository.save(user)
  }

  private async resetLoginAttempts(user: User): Promise<void> {
    if (user.loginAttempts > 0 || user.lockedUntil) {
      user.loginAttempts = 0
      user.lockedUntil = null
      await this.userRepository.save(user)
    }
  }
}
