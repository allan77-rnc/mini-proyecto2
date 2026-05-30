import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type AuthProvider = 'email' | 'google';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape stored in Firestore — timestamps are Firestore Timestamps on read */
export interface FirestoreUserDoc {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
  provider: AuthProvider;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface UsernameRecord {
  uid: string;
}

/** Swagger-annotated response class for user profile endpoints */
export class UserProfileResponse {
  @ApiProperty({ example: 'firebase-uid-abc123' })
  uid!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;

  @ApiProperty({ example: 'juanp99' })
  username!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ enum: ['email', 'google'], example: 'email' })
  provider!: AuthProvider;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

export function toUserProfileResponse(
  profile: UserProfile,
): UserProfileResponse {
  return {
    uid: profile.uid,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    provider: profile.provider,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
