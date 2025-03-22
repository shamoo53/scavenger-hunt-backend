import { Injectable } from '@nestjs/common';
import { SignInDto } from '../dtos/signIn.dto';

@Injectable()
export class AuthService {
  public async signIn(signInDto: SignInDto) {
    console.log(signInDto);
    return signInDto;
  }
}
