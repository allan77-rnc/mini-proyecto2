import type { UserProfile } from '../../common/types/index';

export interface IUsersRepository {
  findByUid(uid: string): Promise<UserProfile | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
  /** Atomically write users/{uid} + usernames/{username} inside a Firestore transaction */
  claimAndCreate(uid: string, profile: UserProfile): Promise<UserProfile>;
  update(
    uid: string,
    updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
  ): Promise<UserProfile>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
