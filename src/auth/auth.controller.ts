import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { SignInDto } from './dtos/signIn.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto'; 
import { Public } from './guards/decorators/public.decorator'; 
import { CreateUserDto } from './dtos/create-user.dto';

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

  // for testing purposes to see whether the protected works
  @Get('protected')
  getProtectedData() {
    return { message: 'This is protected data!' };
  }
}