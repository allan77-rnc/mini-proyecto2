import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Request } from 'express';
import { FirebaseService } from '../../firebase/firebase.service';

type AuthenticatedRequest = Request & { user: DecodedIdToken };

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      request.user = await this.firebase.auth.verifyIdToken(token);
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return null;
  }
}
