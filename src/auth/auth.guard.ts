import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Authentication required. Please log in.');
    }

    const payload = this.authService.verifyToken(token);
    (req as any).user = payload;
    return true;
  }

  private extractToken(req: Request): string | null {
    // 1. Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    // 2. Cookie: auth_token=<token>
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // 3. Query parameter: ?token=<token> (useful for export-csv link clicks)
    if (req.query && typeof req.query.token === 'string') {
      return req.query.token;
    }

    return null;
  }
}
