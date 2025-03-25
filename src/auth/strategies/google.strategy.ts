
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/providers/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('✅ Google OAuth Callback Received');
    console.log('🌍 Profile:', profile);

    const { name, emails } = profile;

    // Extract required fields
    const email = emails?.[0]?.value || 'no-email';
    const firstName = name?.givenName || 'GoogleUser';
    const lastName = name?.familyName || '';

    const password = 'google-auth';

    console.log(`👤 User Info: ${firstName} ${lastName} (${email})`);

    // Create or find user in database
    const user = await this.usersService.findOrCreateGoogleUser({
      email,
      firstName,
      lastName,
      password,
    });

    console.log('🔄 User created or found:', user);
    done(null, user);
  }
}
