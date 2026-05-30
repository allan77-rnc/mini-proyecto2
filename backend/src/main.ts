import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
    credentials: true,
  });

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
