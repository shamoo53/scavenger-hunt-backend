import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { SignInDto } from './dtos/signIn.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Public } from './guards/decorators/public.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './providers/auth.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //   @Public()
  @UseGuards(RateLimitGuard)
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

  @Get('me')
  async me(@Req() req: Request) {
    return this.authService.getProfile(req);
  }

  // for testing purposes to see whether the protected works
  @Get('protected')
  getProtectedData() {
    return { message: 'This is protected data!' };
  }
}
