
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    const user = await this.usersService.findByEmail(signInDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await this.hashingProvider.comparePassword(
      signInDto.password, 
      user.password
    );
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };
    
    return this.tokenService.generateTokens(payload);
  }

  public async signUp(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password
    );
    
    const user = await this.usersService.create({
      firstName: createUserDto.firstName, 
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword
    });
    
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };
    
    return this.tokenService.generateTokens(payload);
  }

  public async refreshToken(refreshToken: string) {
    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }
      
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

  public async validateToken(token: string) {
    try {
      return this.tokenService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }


  public async googleLogin(userData: any) {
    if (!userData) {
      throw new UnauthorizedException('No user data received from Google');
    }

    const { email, firstName, lastName } = userData;

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // Create a new user if they don’t exist
      user = await this.usersService.create({
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        password: '',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };

    return this.tokenService.generateTokens(payload);
  }
}
