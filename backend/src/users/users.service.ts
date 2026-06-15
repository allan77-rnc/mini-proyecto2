import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import type { UserProfile } from '../common/types/index';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { IUsersRepository } from './repositories/users.repository.interface';
import { USERS_REPOSITORY } from './repositories/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
    private readonly firebase: FirebaseService,
  ) {}

  findByUid(uid: string): Promise<UserProfile | null> {
    return this.usersRepo.findByUid(uid);
  }

  isUsernameAvailable(username: string): Promise<boolean> {
    return this.usersRepo.isUsernameAvailable(username);
  }

  createProfile(uid: string, profile: UserProfile): Promise<UserProfile> {
    return this.usersRepo.claimAndCreate(uid, profile);
  }

  async updateProfile(uid: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const current = await this.usersRepo.findByUid(uid);
    if (!current) throw new NotFoundException('User profile not found');

    let profile = current;

    // Username change — atomic swap via Firestore transaction
    if (dto.username && dto.username !== current.username) {
      profile = await this.usersRepo.changeUsername(uid, current.username, dto.username);
    }

    // Email change — update Firebase Auth first, then persist in Firestore
    if (dto.email && dto.email !== current.email) {
      try {
        await this.firebase.auth.updateUser(uid, { email: dto.email });
      } catch (error: unknown) {
        const e = error as { code?: string };
        if (e.code === 'auth/email-already-in-use') {
          throw new ConflictException('Email is already in use by another account');
        }
        throw error;
      }
    }

    const scalarUpdates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>> = {};
    if (dto.firstName !== undefined) scalarUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) scalarUpdates.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined) scalarUpdates.avatarUrl = dto.avatarUrl;
    if (dto.email !== undefined) scalarUpdates.email = dto.email;

    if (Object.keys(scalarUpdates).length > 0) {
      profile = await this.usersRepo.update(uid, scalarUpdates);
    }

    return profile;
  }

  async deleteAccount(uid: string): Promise<void> {
    const current = await this.usersRepo.findByUid(uid);
    if (!current) throw new NotFoundException('User profile not found');

    // Delete Firestore data first, then remove Firebase Auth user
    await this.usersRepo.delete(uid, current.username);
    await this.firebase.auth.deleteUser(uid);
  }
}
