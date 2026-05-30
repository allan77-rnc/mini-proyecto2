import { Inject, Injectable } from '@nestjs/common';
import type { UserProfile } from '../common/types/index';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { IUsersRepository } from './repositories/users.repository.interface';
import { USERS_REPOSITORY } from './repositories/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
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

  updateProfile(uid: string, dto: UpdateProfileDto): Promise<UserProfile> {
    return this.usersRepo.update(uid, dto);
  }
}
