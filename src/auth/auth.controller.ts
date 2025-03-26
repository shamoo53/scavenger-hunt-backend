import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { SignInDto } from './dtos/signIn.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto'; 
import { Public } from './guards/decorators/public.decorator'; 
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './auth.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RegisterDTO } from './dtos/register.dto';
import { LoginDTO } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-in')
  public signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('sign-up')
  public signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Public()
  @Post('refresh')
  public refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDTO) {
    return this.authService.register(registerDto);
  }

  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async me(@Req() req: Request) {
    return this.authService.getProfile(req.user);
  }

  // for testing purposes to see whether the protected works
  @Get('protected')
  getProtectedData() {
    return { message: 'This is protected data!' };
  }
}