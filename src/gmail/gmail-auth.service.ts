import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import type { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CryptoService } from '../common/crypto.service';
import { GmailAccount } from './gmail-account.model';

export interface GmailStatusResult {
  connected: boolean;
  email: string | null;
  lastSyncedAt: Date | null;
}

export interface GmailCallbackResult {
  connected: boolean;
  email: string;
}

interface OAuthStatePayload {
  userId?: string;
  sub?: string;
}

@Injectable()
export class GmailAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    @InjectModel(GmailAccount)
    private readonly gmailAccountModel: typeof GmailAccount,
  ) {}

  // Create a new client per call to prevent state/token leakage across requests
  private createOAuthClient(): OAuth2Client {
    return new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GMAIL_REDIRECT_URI'),
    );
  }

  getConnectUrl(userId: string): string {
    const client = this.createOAuthClient();
    const state = this.jwtService.sign({ userId }, { expiresIn: '10m' });

    return client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'email'],
      prompt: 'consent',
      include_granted_scopes: true,
      state,
    });
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<GmailCallbackResult> {
    let userId: string;
    try {
      const payload =
        await this.jwtService.verifyAsync<OAuthStatePayload>(state);
      const extractedUserId = payload.userId ?? payload.sub;
      if (!extractedUserId) {
        throw new BadRequestException('State missing user identification');
      }
      userId = extractedUserId;
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Invalid or expired OAuth state parameter');
    }

    const client = this.createOAuthClient();
    let tokens: Credentials;
    try {
      const response = await client.getToken(code);
      tokens = response.tokens;
    } catch {
      throw new BadRequestException(
        'Failed to exchange authorization code for tokens',
      );
    }

    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'Google did not return a refresh token. Re-authorization with consent prompt is required.',
      );
    }

    if (!tokens.id_token) {
      throw new BadRequestException('Google did not return an ID token');
    }

    const decoded: unknown = this.jwtService.decode<unknown>(tokens.id_token);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('email' in decoded) ||
      typeof (decoded as Record<string, unknown>).email !== 'string'
    ) {
      throw new BadRequestException(
        'Unable to read email from Google ID token',
      );
    }
    const googleEmail = (decoded as Record<string, unknown>).email as string;

    const refreshTokenEnc = this.cryptoService.encrypt(tokens.refresh_token);

    const scopes = tokens.scope
      ? tokens.scope.split(' ')
      : ['https://www.googleapis.com/auth/gmail.readonly', 'email'];

    let account = await this.gmailAccountModel.findOne({
      where: { userId },
    });

    if (account) {
      account.googleEmail = googleEmail;
      account.refreshTokenEnc = refreshTokenEnc;
      account.scopes = scopes;
      account.status = 'active';
      await account.save();
    } else {
      account = await this.gmailAccountModel.create({
        userId,
        googleEmail,
        refreshTokenEnc,
        scopes,
        status: 'active',
      });
    }

    return {
      connected: true,
      email: account.googleEmail,
    };
  }

  async getStatus(userId: string): Promise<GmailStatusResult> {
    const account = await this.gmailAccountModel.findOne({
      where: { userId },
    });

    if (!account) {
      return {
        connected: false,
        email: null,
        lastSyncedAt: null,
      };
    }

    return {
      connected: true,
      email: account.googleEmail,
      lastSyncedAt: account.lastSyncedAt,
    };
  }
}
