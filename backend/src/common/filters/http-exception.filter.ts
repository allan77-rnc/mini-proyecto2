import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface FirebaseError {
  code: string;
  message: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>)['code'] === 'string'
  );
}

const FIREBASE_ERROR_MAP: Record<string, { status: number; message: string }> =
  {
    'auth/email-already-in-use': {
      status: 409,
      message: 'Email is already in use',
    },
    'auth/invalid-email': { status: 400, message: 'Invalid email address' },
    'auth/weak-password': {
      status: 400,
      message: 'Password must be at least 8 characters',
    },
    'auth/user-not-found': {
      status: 404,
      message: 'No account found with this email',
    },
    'auth/wrong-password': { status: 401, message: 'Invalid credentials' },
    'auth/too-many-requests': {
      status: 429,
      message: 'Too many attempts. Try again later',
    },
    'auth/id-token-expired': {
      status: 401,
      message: 'Authentication token has expired',
    },
    'auth/invalid-id-token': {
      status: 401,
      message: 'Invalid authentication token',
    },
    'auth/id-token-revoked': {
      status: 401,
      message: 'Authentication token has been revoked',
    },
    'auth/argument-error': { status: 400, message: 'Invalid request argument' },
  };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolveError(exception);

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveError(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as Record<string, unknown>)['message'] as string | string[]);
      return { status: exception.getStatus(), message };
    }

    if (isFirebaseError(exception)) {
      const mapped = FIREBASE_ERROR_MAP[exception.code];
      if (mapped) return mapped;
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
