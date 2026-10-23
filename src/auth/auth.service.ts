import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { google, oauth2_v2 } from 'googleapis';
import { User } from '../model/user.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  // A new client per request to ensure tokens are never shared across users
  private createClient(): OAuth2Client {
    return new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(): string {
    return this.createClient().generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
    });
  }

  async signToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.signAsync(payload);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async handleCallback(code: string): Promise<User> {
    const client = this.createClient();

    let tokens: Credentials;
    try {
      const response = await client.getToken(code);
      tokens = response.tokens;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[OAuth] Token exchange error:', msg);
      throw new UnauthorizedException(
        'Failed to exchange authorization code for tokens',
      );
    }

    client.setCredentials(tokens);

    let profile: oauth2_v2.Schema$Userinfo;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();

      if (!data.id) {
        throw new UnauthorizedException('Google profile ID is missing');
      }

      profile = data;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[OAuth] Userinfo fetch error:', msg);
      throw new UnauthorizedException(
        'Failed to fetch user profile from Google',
      );
    }

    try {
      const [user] = await this.userModel.findOrCreate({
        where: { googleId: profile.id },
        defaults: {
          email: profile.email ?? '',
          name: profile.name ?? undefined,
          avatarUrl: profile.picture ?? undefined,
          googleId: profile.id,
        },
      });

      return user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Database] findOrCreate error:', msg);
      throw err;
    }
  }
}
