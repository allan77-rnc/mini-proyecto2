import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { UserRecord } from 'firebase-admin/auth';
import type { UserProfile } from '../common/types/index';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import type { CompleteProfileDto } from './dto/complete-profile.dto';
import type { RegisterDto } from './dto/register.dto';

export interface RegisterResponse {
  /** Firebase custom token — frontend calls signInWithCustomToken(auth, customToken) */
  customToken: string;
  user: UserProfile;
}

export interface GoogleAuthResponse {
  user: UserProfile;
  isNewUser: false;
}

export interface GoogleNewUserResponse {
  isNewUser: true;
  googleData: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const available = await this.usersService.isUsernameAvailable(dto.username);
    if (!available) throw new ConflictException('Username is already taken');

    const firebaseUser = await this.createFirebaseUser(dto);

    const now = new Date();
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
      avatarUrl: dto.avatarUrl ?? null,
      provider: 'email',
      createdAt: now,
      updatedAt: now,
    };

    await this.usersService
      .createProfile(firebaseUser.uid, profile)
      .catch(async (err: unknown) => {
        // Roll back the Firebase Auth user if Firestore write fails
        await this.firebase.auth
          .deleteUser(firebaseUser.uid)
          .catch(() => undefined);
        throw err;
      });

    const customToken = await this.firebase.auth.createCustomToken(
      firebaseUser.uid,
    );
    return { customToken, user: profile };
  }

  async handleGoogleAuth(
    idToken: string,
  ): Promise<GoogleAuthResponse | GoogleNewUserResponse> {
    const decoded = await this.firebase.auth.verifyIdToken(idToken);
    const existing = await this.usersService.findByUid(decoded.uid);

    if (existing) {
      return { user: existing, isNewUser: false };
    }

    const nameParts = (decoded.name as string | undefined)?.split(' ') ?? [];
    return {
      isNewUser: true,
      googleData: {
        email: decoded.email ?? '',
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') || '',
        avatarUrl: decoded.picture ?? null,
      },
    };
  }

  async completeGoogleProfile(
    uid: string,
    dto: CompleteProfileDto,
  ): Promise<UserProfile> {
    const existing = await this.usersService.findByUid(uid);
    if (existing) throw new ConflictException('Profile already completed');

    const available = await this.usersService.isUsernameAvailable(dto.username);
    if (!available) throw new ConflictException('Username is already taken');

    const firebaseUser = await this.firebase.auth.getUser(uid);
    const nameParts = (firebaseUser.displayName ?? '').split(' ');

    const now = new Date();
    const profile: UserProfile = {
      uid,
      email: firebaseUser.email ?? '',
      firstName: dto.firstName ?? nameParts[0] ?? '',
      lastName: dto.lastName ?? (nameParts.slice(1).join(' ') || ''),
      username: dto.username,
      avatarUrl: firebaseUser.photoURL ?? null,
      provider: 'google',
      createdAt: now,
      updatedAt: now,
    };

    return this.usersService.createProfile(uid, profile);
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await this.firebase.auth.getUserByEmail(email);
    } catch {
      // Don't leak whether the email exists; silently succeed for security
      return;
    }

    await this.firebase.auth.generatePasswordResetLink(email).catch(() => {
      throw new InternalServerErrorException(
        'Failed to generate password reset link',
      );
    });
  }

  async getProfile(uid: string): Promise<UserProfile> {
    const profile = await this.usersService.findByUid(uid);
    if (!profile) throw new NotFoundException('User profile not found');
    return profile;
  }

  private async createFirebaseUser(dto: RegisterDto): Promise<UserRecord> {
    try {
      return await this.firebase.auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: `${dto.firstName} ${dto.lastName}`,
        photoURL: dto.avatarUrl,
      });
    } catch (error: unknown) {
      throw this.mapFirebaseError(error);
    }
  }

  private mapFirebaseError(error: unknown): HttpException {
    const e = error as { code?: string };
    const map: Record<string, HttpException> = {
      'auth/email-already-in-use': new ConflictException(
        'Email is already in use',
      ),
      'auth/invalid-email': new ConflictException('Invalid email address'),
      'auth/weak-password': new ConflictException(
        'Password must be at least 8 characters',
      ),
    };
    return (
      (e.code ? map[e.code] : undefined) ??
      new InternalServerErrorException('Registration failed')
    );
  }
}
