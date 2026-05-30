import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  toUserProfileResponse,
  UserProfileResponse,
} from '../common/types/index';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user (email/password)',
    description:
      'Creates a Firebase Auth user and the Firestore profile in a single atomic operation. ' +
      'Returns a `customToken` that the frontend must pass to `signInWithCustomToken(auth, customToken)`.',
  })
  @ApiCreatedResponse({
    schema: {
      properties: {
        customToken: {
          type: 'string',
          description: 'Use with signInWithCustomToken()',
        },
        user: { $ref: '#/components/schemas/UserProfileResponse' },
      },
    },
  })
  @ApiConflictResponse({ description: 'Email or username already in use' })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ customToken: string; user: UserProfileResponse }> {
    const result = await this.authService.register(dto);
    return {
      customToken: result.customToken,
      user: toUserProfileResponse(result.user),
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a Google ID token',
    description:
      'Pass the Firebase ID token obtained from the Google popup. ' +
      'If the user already has a profile → returns `{ user }`. ' +
      'If first time → returns `{ isNewUser: true, googleData }` — call `/auth/google/complete-profile` next.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        {
          properties: {
            isNewUser: { type: 'boolean', example: false },
            user: { $ref: '#/components/schemas/UserProfileResponse' },
          },
        },
        {
          properties: {
            isNewUser: { type: 'boolean', example: true },
            googleData: {
              properties: {
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
              },
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired ID token' })
  async googleAuth(@Body() dto: GoogleAuthDto): Promise<unknown> {
    const result = await this.authService.handleGoogleAuth(dto.idToken);
    if (!result.isNewUser) {
      return { isNewUser: false, user: toUserProfileResponse(result.user) };
    }
    return result;
  }

  @Post('google/complete-profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete Google user profile (choose username)',
    description:
      'Called after the first Google sign-in when the user needs to pick a username. ' +
      'Requires a valid Firebase Bearer token.',
  })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiConflictResponse({
    description: 'Username already taken or profile already exists',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  async completeGoogleProfile(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CompleteProfileDto,
  ): Promise<UserProfileResponse> {
    const profile = await this.authService.completeGoogleProfile(user.uid, dto);
    return toUserProfileResponse(profile);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a password reset email',
    description:
      'Triggers a Firebase password reset email to the given address. ' +
      'Always returns 200 to avoid leaking whether the email is registered.',
  })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.sendPasswordReset(dto.email);
    return {
      message:
        'If an account exists for that email, a reset link has been sent.',
    };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own Firestore profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiNotFoundResponse({ description: 'Profile not found in Firestore' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  async getMe(
    @CurrentUser() user: DecodedIdToken,
  ): Promise<UserProfileResponse> {
    const profile = await this.authService.getProfile(user.uid);
    return toUserProfileResponse(profile);
  }
}
