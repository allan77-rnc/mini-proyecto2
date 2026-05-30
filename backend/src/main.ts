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
      'REST API for the collaborative study platform.\n\n' +
        '**Auth flow:**\n' +
        '1. Register → `POST /api/auth/register` → receive `customToken` → call `signInWithCustomToken(auth, customToken)` on the frontend.\n' +
        '2. Google OAuth → complete popup on frontend → `POST /api/auth/google` → if `needsUsername` → `POST /api/auth/google/complete-profile`.\n' +
        '3. All protected endpoints require `Authorization: Bearer <Firebase ID token>`.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Firebase ID Token',
      description:
        'Paste the Firebase ID token obtained from getIdToken() on the frontend',
    })
    .addTag('auth', 'Registration, Google OAuth, password reset, current user')
    .addTag('users', 'Username availability check and profile updates')
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
