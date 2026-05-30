import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { FirestoreUserDoc, UserProfile } from '../../common/types/index';
import { FirebaseService } from '../../firebase/firebase.service';
import type { IUsersRepository } from './users.repository.interface';

const USERS = 'users';
const USERNAMES = 'usernames';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly firebase: FirebaseService) {}

  async findByUid(uid: string): Promise<UserProfile | null> {
    const snap = await this.firebase.firestore.collection(USERS).doc(uid).get();
    if (!snap.exists) return null;
    return this.toProfile(snap.data() as FirestoreUserDoc);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const snap = await this.firebase.firestore
      .collection(USERNAMES)
      .doc(username.toLowerCase())
      .get();
    return !snap.exists;
  }

  async claimAndCreate(
    uid: string,
    profile: UserProfile,
  ): Promise<UserProfile> {
    const normalizedUsername = profile.username.toLowerCase();
    const usernameRef = this.firebase.firestore
      .collection(USERNAMES)
      .doc(normalizedUsername);
    const userRef = this.firebase.firestore.collection(USERS).doc(uid);

    await this.firebase.firestore.runTransaction(async (tx) => {
      const usernameSnap = await tx.get(usernameRef);
      if (usernameSnap.exists) {
        throw new ConflictException(
          `Username "${profile.username}" is already taken`,
        );
      }
      tx.set(usernameRef, { uid });
      tx.set(userRef, this.toFirestoreDoc(profile));
    });

    return profile;
  }

  async update(
    uid: string,
    updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
  ): Promise<UserProfile> {
    const ref = this.firebase.firestore.collection(USERS).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('User not found');

    await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });

    const updated = await ref.get();
    return this.toProfile(updated.data() as FirestoreUserDoc);
  }

  private toProfile(doc: FirestoreUserDoc): UserProfile {
    return {
      uid: doc.uid,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      username: doc.username,
      avatarUrl: doc.avatarUrl,
      provider: doc.provider,
      createdAt: doc.createdAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    };
  }

  private toFirestoreDoc(profile: UserProfile): FirestoreUserDoc {
    return {
      uid: profile.uid,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(profile.updatedAt),
    };
  }
}
