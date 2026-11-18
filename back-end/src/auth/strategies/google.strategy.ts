import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const rawEmail = profile.emails?.[0] as
      | { value: string; verified?: boolean | string }
      | undefined;
    const rawJson = (profile as unknown as {
      _json?: { email_verified?: boolean | string };
    })._json;

    const verified = rawEmail?.verified ?? rawJson?.email_verified;

    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      emailVerified: verified === true || verified === 'true',
      name:
        profile.displayName ||
        `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
      avatar: profile.photos?.[0]?.value || null,
    };
  }
}
