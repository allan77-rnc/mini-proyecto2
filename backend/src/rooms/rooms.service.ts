import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UserProfile } from '../common/types/index';
import type { CreateRoomDto } from './dto/create-room.dto';
import type { UpdateRoomDto } from './dto/update-room.dto';
import type { Message } from './repositories/messages.repository';
import { MessagesRepository } from './repositories/messages.repository';
import type { IRoomsRepository, Room } from './repositories/rooms.repository.interface';
import { ROOMS_REPOSITORY } from './repositories/rooms.repository.interface';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOMS_REPOSITORY) private readonly roomsRepo: IRoomsRepository,
    private readonly messagesRepo: MessagesRepository,
  ) {}

  async createRoom(host: UserProfile, dto: CreateRoomDto): Promise<Room> {
    return this.roomsRepo.create({
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      hostUid: host.uid,
      hostUsername: host.username,
      isActive: true,
      participantCount: 0,
    });
  }

  getOwnRooms(hostUid: string): Promise<Room[]> {
    return this.roomsRepo.findByHost(hostUid);
  }

  async getRoom(id: string): Promise<Room> {
    const room = await this.roomsRepo.findById(id);
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async updateRoom(id: string, requestorUid: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.roomsRepo.findById(id);
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    if (room.hostUid !== requestorUid) {
      throw new ForbiddenException('Only the host can edit this room');
    }
    return this.roomsRepo.update(id, { name: dto.name });
  }

  async deleteRoom(id: string, requestorUid: string): Promise<void> {
    const room = await this.roomsRepo.findById(id);
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    if (room.hostUid !== requestorUid) {
      throw new ForbiddenException('Only the host can delete this room');
    }
    await this.roomsRepo.delete(id);
  }

  getMessages(roomId: string, limit = 50): Promise<Message[]> {
    return this.messagesRepo.findByRoom(roomId, limit);
  }
}
