import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from '../dtos/signIn.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  public async signIn(signInDto: SignInDto) {
    const payload = { email: signInDto.email, sub: 'user-id' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
