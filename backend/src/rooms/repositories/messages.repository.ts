import { Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseService } from '../../firebase/firebase.service';

export interface Message {
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  text: string;
  createdAt: Date;
}

interface FirestoreMessageDoc {
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  text: string;
  createdAt: FirebaseFirestore.Timestamp;
}

@Injectable()
export class MessagesRepository {
  constructor(private readonly firebase: FirebaseService) {}

  async save(message: Omit<Message, 'createdAt'>): Promise<Message> {
    const ref = this.firebase.firestore
      .collection('rooms')
      .doc(message.roomId)
      .collection('messages')
      .doc(message.id);

    await ref.set({ ...message, createdAt: FieldValue.serverTimestamp() });

    const snap = await ref.get();
    return this.toMessage(snap.data() as FirestoreMessageDoc);
  }

  async findByRoom(roomId: string, limit = 50): Promise<Message[]> {
    const snap = await this.firebase.firestore
      .collection('rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limitToLast(limit)
      .get();

    return snap.docs.map((d) => this.toMessage(d.data() as FirestoreMessageDoc));
  }

  private toMessage(doc: FirestoreMessageDoc): Message {
    return {
      id: doc.id,
      roomId: doc.roomId,
      senderUid: doc.senderUid,
      senderUsername: doc.senderUsername,
      text: doc.text,
      createdAt: doc.createdAt.toDate(),
    };
  }
}
