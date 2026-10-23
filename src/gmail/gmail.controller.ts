import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';
import {
  GmailAuthService,
  GmailCallbackResult,
  GmailStatusResult,
} from './gmail-auth.service';

@ApiTags('Gmail')
@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailAuthService: GmailAuthService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connect')
  connect(@Req() req: AuthRequest, @Res() res: Response): void {
    const url = this.gmailAuthService.getConnectUrl(req.user.sub);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<GmailCallbackResult> {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }
    if (!state) {
      throw new BadRequestException('Missing state parameter');
    }
    return this.gmailAuthService.handleCallback(code, state);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: AuthRequest): Promise<GmailStatusResult> {
    return this.gmailAuthService.getStatus(req.user.sub);
  }
}
