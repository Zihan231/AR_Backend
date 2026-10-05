import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import type { Request, Response } from 'express';

export interface LoginDto {
  username?: string;
  password?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    if (!body || !body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }

    const result = this.authService.login(body.username, body.password);

    // Set HTTP cookie for seamless browser navigation
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return result;
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return {
      success: true,
      user: (req as any).user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
