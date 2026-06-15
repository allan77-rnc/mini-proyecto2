import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseService } from '../../firebase/firebase.service';
import type { IRoomsRepository, Room } from './rooms.repository.interface';

const ROOMS = 'rooms';

interface FirestoreRoomDoc {
  id: string;
  name: string;
  description?: string;
  hostUid: string;
  hostUsername: string;
  isActive: boolean;
  participantCount: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

@Injectable()
export class RoomsRepository implements IRoomsRepository {
  constructor(private readonly firebase: FirebaseService) {}

  async create(room: Omit<Room, 'createdAt' | 'updatedAt'>): Promise<Room> {
    const ref = this.firebase.firestore.collection(ROOMS).doc(room.id);
    const now = FieldValue.serverTimestamp();

    await ref.set({ ...room, createdAt: now, updatedAt: now });

    const snap = await ref.get();
    return this.toRoom(snap.data() as FirestoreRoomDoc);
  }

  async findByHost(hostUid: string): Promise<Room[]> {
    const snap = await this.firebase.firestore
      .collection(ROOMS)
      .where('hostUid', '==', hostUid)
      .orderBy('createdAt', 'desc')
      .get();

    return snap.docs.map((d) => this.toRoom(d.data() as FirestoreRoomDoc));
  }

  async findById(id: string): Promise<Room | null> {
    const snap = await this.firebase.firestore.collection(ROOMS).doc(id).get();
    if (!snap.exists) return null;
    return this.toRoom(snap.data() as FirestoreRoomDoc);
  }

  async delete(id: string): Promise<void> {
    const ref = this.firebase.firestore.collection(ROOMS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException(`Room ${id} not found`);
    await ref.delete();
  }

  private toRoom(doc: FirestoreRoomDoc): Room {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      hostUid: doc.hostUid,
      hostUsername: doc.hostUsername,
      isActive: doc.isActive,
      participantCount: doc.participantCount,
      createdAt: doc.createdAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    };
  }
}
