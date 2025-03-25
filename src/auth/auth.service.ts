import { Injectable, BadRequestException } from '@nestjs/common';
import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/register.dto';
import { UsersService } from '../users/users.service';
import { SignInDto } from './dtos/signIn.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDTO) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDTO) {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    return { message: 'Login successful', user };
  }

  async getProfile(user: any) {
    return user;
  }

  public async signIn(signInDto: SignInDto) {
}

async signUp(createUserDto: CreateUserDto) {
}

async refreshToken(refreshToken: string) {
}

async validateToken(token: string) {
}  
}
