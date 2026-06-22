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

interface PresenceEntry {
  uid: string;
  username: string;
  roomId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface JoinRoomPayload {
  roomId: string;
  idToken: string;
}

interface SendMessagePayload {
  roomId: string;
  text: string;
  idToken: string;
}

interface WebRtcOfferPayload {
  targetSocketId: string;
  sdp: unknown;
  idToken: string;
}

interface WebRtcAnswerPayload {
  targetSocketId: string;
  sdp: unknown;
  idToken: string;
}

interface WebRtcIceCandidatePayload {
  targetSocketId: string;
  candidate: unknown;
  idToken: string;
}

interface WebRtcMediaStatePayload {
  idToken: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/rooms' })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() private readonly server!: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  private readonly presence = new Map<string, PresenceEntry>();

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

    // Collect current participants before this client joins
    const currentParticipants = this.getParticipants(payload.roomId);

    await client.join(payload.roomId);
    this.presence.set(client.id, {
      uid,
      username,
      roomId: payload.roomId,
      audioEnabled: true,
      videoEnabled: true,
    });

    // Send the joining client its own socket ID + existing participants list
    client.emit('room:joined', {
      roomId: payload.roomId,
      socketId: client.id,
      participants: currentParticipants,
    });

    // Notify existing participants about the new user (include socketId so they can send offers)
    client.to(payload.roomId).emit('room:user-joined', {
      socketId: client.id,
      username,
    });

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

  // ─── WebRTC Signaling ────────────────────────────────────────────────────────

  @SubscribeMessage('webrtc:offer')
  async handleWebRtcOffer(
    @MessageBody() payload: WebRtcOfferPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.verifyToken(payload.idToken);

    this.server.to(payload.targetSocketId).emit('webrtc:offer', {
      fromSocketId: client.id,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('webrtc:answer')
  async handleWebRtcAnswer(
    @MessageBody() payload: WebRtcAnswerPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.verifyToken(payload.idToken);

    this.server.to(payload.targetSocketId).emit('webrtc:answer', {
      fromSocketId: client.id,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('webrtc:ice-candidate')
  async handleWebRtcIceCandidate(
    @MessageBody() payload: WebRtcIceCandidatePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.verifyToken(payload.idToken);

    this.server.to(payload.targetSocketId).emit('webrtc:ice-candidate', {
      fromSocketId: client.id,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage('webrtc:media-state')
  async handleWebRtcMediaState(
    @MessageBody() payload: WebRtcMediaStatePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.verifyToken(payload.idToken);

    const entry = this.presence.get(client.id);
    if (!entry) throw new WsException('Not in a room');

    entry.audioEnabled = payload.audioEnabled;
    entry.videoEnabled = payload.videoEnabled;

    client.to(entry.roomId).emit('webrtc:media-state', {
      socketId: client.id,
      username: entry.username,
      audioEnabled: payload.audioEnabled,
      videoEnabled: payload.videoEnabled,
    });
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  async handleDisconnect(client: Socket): Promise<void> {
    await this.removeFromRoom(client);
  }

  private async removeFromRoom(client: Socket): Promise<void> {
    const info = this.presence.get(client.id);
    if (!info) return;

    this.presence.delete(client.id);
    await client.leave(info.roomId);

    // Include socketId so peers can tear down the correct RTCPeerConnection
    client.to(info.roomId).emit('room:user-left', {
      socketId: client.id,
      username: info.username,
    });

    this.logger.log(`${info.username} left room ${info.roomId}`);
  }

  private getParticipants(
    roomId: string,
  ): Array<{ socketId: string; username: string; audioEnabled: boolean; videoEnabled: boolean }> {
    const result: Array<{ socketId: string; username: string; audioEnabled: boolean; videoEnabled: boolean }> = [];
    for (const [socketId, entry] of this.presence.entries()) {
      if (entry.roomId === roomId) {
        result.push({
          socketId,
          username: entry.username,
          audioEnabled: entry.audioEnabled,
          videoEnabled: entry.videoEnabled,
        });
      }
    }
    return result;
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
