import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { AppConfigService } from '../config/app-config.service.js';

export interface TokenPayload {
  username: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly appConfig: AppConfigService) {}

  validateCredentials(username: string, pass: string): boolean {
    const expectedUser = this.appConfig.adminUsername;
    const expectedPass = this.appConfig.adminPassword;

    if (!username || !pass) {
      return false;
    }

    const userBuffer = Buffer.from(username);
    const expectedUserBuffer = Buffer.from(expectedUser);
    const passBuffer = Buffer.from(pass);
    const expectedPassBuffer = Buffer.from(expectedPass);

    const userMatch =
      userBuffer.length === expectedUserBuffer.length &&
      crypto.timingSafeEqual(userBuffer, expectedUserBuffer);

    const passMatch =
      passBuffer.length === expectedPassBuffer.length &&
      crypto.timingSafeEqual(passBuffer, expectedPassBuffer);

    return userMatch && passMatch;
  }

  generateToken(username: string): string {
    const now = Math.floor(Date.now() / 1000);
    // Token valid for 24 hours
    const payload: TokenPayload = {
      username,
      role: 'admin',
      iat: now,
      exp: now + 24 * 60 * 60,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.appConfig.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyToken(token: string): TokenPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Authentication token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed authentication token');
    }

    const [headerB64, payloadB64, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', this.appConfig.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedSigBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    try {
      const payload: TokenPayload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Authentication token has expired');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  login(username: string, pass: string): { success: boolean; token: string; user: { username: string; role: string } } {
    if (!this.validateCredentials(username, pass)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token = this.generateToken(username);
    this.logger.log(`Admin '${username}' logged in successfully`);

    return {
      success: true,
      token,
      user: {
        username,
        role: 'admin',
      },
    };
  }
}
