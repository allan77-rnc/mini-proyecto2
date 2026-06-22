import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

class CorsIoAdapter extends IoAdapter {
  private readonly allowedOrigins: string[];

  constructor(app: Parameters<typeof IoAdapter.prototype.createIOServer>[1], allowedOrigins: string[]) {
    super(app);
    this.allowedOrigins = allowedOrigins;
  }

  createIOServer(port: number, options?: ServerOptions): ReturnType<IoAdapter['createIOServer']> {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin || this.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`WS CORS: origin ${origin} not allowed`));
          }
        },
        credentials: true,
      },
    });
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — supports multiple origins via comma-separated ALLOWED_ORIGINS env var
  const rawOrigins = process.env['ALLOWED_ORIGINS'] ?? process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. curl, Swagger UI, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  // Socket.io adapter — uses the same origin list so there are no conflicting CORS headers
  app.useWebSocketAdapter(new CorsIoAdapter(app, allowedOrigins));

  // Global validation pipe — strips unknown fields, auto-transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter (maps Firebase errors → HTTP exceptions)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger UI at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini Proyecto 2 — API')
    .setDescription(
      `REST API for the collaborative study platform.

## Auth flow

**Email/password registration**

\`POST /api/auth/register\` → returns a \`customToken\` → frontend calls \`signInWithCustomToken(auth, customToken)\`

**Google OAuth**

Frontend completes Google popup → \`POST /api/auth/google\`
- Existing user → returns \`{ user }\`
- New user → returns \`{ isNewUser: true }\` → call \`POST /api/auth/google/complete-profile\` with a username

**Protected endpoints**

Add \`Authorization: Bearer <Firebase ID token>\` to every protected request.
Get the token on the frontend with \`await currentUser.getIdToken()\`.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
        description: 'Run `await currentUser.getIdToken()` on the frontend and paste the result here.',
      },
      'firebase',
    )
    .addTag('auth', 'Registration, Google OAuth, password reset and current user profile')
    .addTag('users', 'Username availability and profile updates')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
}

void bootstrap();
