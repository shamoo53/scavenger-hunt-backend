import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../user/entities/user.entity';
import { UserService } from '../../user/user.service';
import { CryptoService } from './crypto.service';
import { WalletService } from './wallet.service';
import { EmailService } from './email.service';
import {
  LoginDto,
  RegisterDto,
  WalletAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import {
  AuthResponse,
  JwtPayload,
} from '../../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000;
  private readonly passwordResetExpiry = 60 * 60 * 1000;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private walletService: WalletService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, walletAddress, username } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { walletAddress }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.walletAddress === walletAddress) {
        throw new ConflictException('Wallet address already registered');
      }
    }

    // Check username uniqueness if provided
    if (username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Validate wallet address format
    if (!this.walletService.isValidWalletAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address format');
    }

    // Hash password
    const hashedPassword = await this.cryptoService.hashPassword(password);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      walletAddress,
      username,
      emailVerificationToken: this.cryptoService.generateRandomToken(),
    });

    const savedUser = await this.userRepository.save(user);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, username);
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${email}:`, error);
    }

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

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
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await this.cryptoService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    await this.resetLoginAttempts(user);

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

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
    };
  }

  async walletAuth(walletAuthDto: WalletAuthDto): Promise<AuthResponse> {
    const { walletAddress, signature, message, nonce } = walletAuthDto;

    // Find user by wallet address
    const user = await this.userRepository.findOne({
      where: { walletAddress },
    });

    if (!user) {
      throw new UnauthorizedException('Wallet not registered');
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify signature
    const isSignatureValid = await this.walletService.verifyWalletSignature(
      walletAddress,
      message,
      signature,
    );

    if (!isSignatureValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

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
    };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts += 1;

    if (user.loginAttempts >= this.maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + this.lockoutDuration);
      this.logger.warn(
        `User ${user.email} account locked due to too many failed login attempts`,
      );
    }

    await this.userRepository.save(user);
  }

  private async resetLoginAttempts(user: User): Promise<void> {
    if (user.loginAttempts > 0 || user.lockedUntil) {
      user.loginAttempts = 0;
      user.lockedUntil = null;
      await this.userRepository.save(user);
    }
  }

  // Add other methods as needed...
}
