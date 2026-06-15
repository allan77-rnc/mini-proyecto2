import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import type { Message } from './repositories/messages.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { RoomsService } from './rooms.service';

interface JoinRoomPayload {
  roomId: string;
  idToken: string;
}

interface SendMessagePayload {
  roomId: string;
  text: string;
  idToken: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/rooms' })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() private readonly server!: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  // Maps socketId → { uid, username, roomId }
  private readonly presence = new Map<string, { uid: string; username: string; roomId: string }>();

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly messagesRepo: MessagesRepository,
  ) {}

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { uid, username } = await this.verifyToken(payload.idToken);
    const room = await this.roomsService.getRoom(payload.roomId).catch(() => null);
    if (!room) throw new WsException(`Room ${payload.roomId} not found`);

    await client.join(payload.roomId);
    this.presence.set(client.id, { uid, username, roomId: payload.roomId });

    client.emit('room:joined', { roomId: payload.roomId });
    client.to(payload.roomId).emit('room:user-joined', { username });

    this.logger.log(`${username} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket): Promise<void> {
    await this.removeFromRoom(client);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { uid, username } = await this.verifyToken(payload.idToken);
    const room = await this.roomsService.getRoom(payload.roomId).catch(() => null);
    if (!room) throw new WsException(`Room ${payload.roomId} not found`);

    const message: Message = await this.messagesRepo.save({
      id: randomUUID(),
      roomId: payload.roomId,
      senderUid: uid,
      senderUsername: username,
      text: payload.text,
    });

    const outbound = {
      id: message.id,
      roomId: message.roomId,
      senderUid: message.senderUid,
      senderUsername: message.senderUsername,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };

    this.server.to(payload.roomId).emit('room:message', outbound);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.removeFromRoom(client);
  }

  private async removeFromRoom(client: Socket): Promise<void> {
    const info = this.presence.get(client.id);
    if (!info) return;

    this.presence.delete(client.id);
    await client.leave(info.roomId);
    client.to(info.roomId).emit('room:user-left', { username: info.username });

    this.logger.log(`${info.username} left room ${info.roomId}`);
  }

  private async verifyToken(idToken: string): Promise<{ uid: string; username: string }> {
    let uid: string;
    try {
      const decoded = await this.firebase.auth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      throw new WsException('Invalid or expired Firebase ID token');
    }

    const profile = await this.usersService.findByUid(uid);
    if (!profile) throw new WsException('User profile not found');

    return { uid, username: profile.username };
  }
}
