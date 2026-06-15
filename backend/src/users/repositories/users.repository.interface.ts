import type { UserProfile } from '../../common/types/index';

export interface IUsersRepository {
  findByUid(uid: string): Promise<UserProfile | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
  /** Atomically write users/{uid} + usernames/{username} — used on registration */
  claimAndCreate(uid: string, profile: UserProfile): Promise<UserProfile>;
  /** Update scalar fields (firstName, lastName, avatarUrl, email) */
  update(uid: string, updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>): Promise<UserProfile>;
  /** Atomically swap old username for new one in the usernames collection */
  changeUsername(uid: string, oldUsername: string, newUsername: string): Promise<UserProfile>;
  /** Remove users/{uid} and usernames/{username} */
  delete(uid: string, username: string): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
