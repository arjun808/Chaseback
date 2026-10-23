import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthRequest } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  googleLogin(@Res() res: Response): void {
    return res.redirect(this.authService.getAuthUrl());
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code?: string) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }
    const user = await this.authService.handleCallback(code);
    const token = await this.authService.signToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthRequest) {
    const user = await this.authService.findUserById(req.user.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout() {
    return { message: 'Logged out successfully' };
  }
}
