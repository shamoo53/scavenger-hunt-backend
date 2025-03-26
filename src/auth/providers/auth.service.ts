import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from '../dtos/signIn.dto';
import { TokenService } from './token.service';
import { UsersService } from '../../users/providers/users.service';
import { HashingProvider } from './hashing.provider';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
  ) {}

  public async signIn(signInDto: SignInDto) {
    // Find user by email/username
    const user = await this.usersService.findByEmail(signInDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using your existing HashingProvider
    const isPasswordValid = await this.hashingProvider.comparePassword(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };

    // Return tokens using the TokenService
    return this.tokenService.generateTokens(payload);
  }

  async signUp(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the password
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );

    // Create the user - map name to firstName
    const user = await this.usersService.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword,
    });

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };

    return this.tokenService.generateTokens(payload);
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      // Check if user still exists
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        roles: user.roles || [],
      };

      return this.tokenService.generateTokens(newPayload);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      return this.tokenService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(user: any) {
    return user;
  }
}
