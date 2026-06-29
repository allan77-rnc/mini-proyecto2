import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { IceConfigResponse, IceServerDto } from './dto/ice-config-response.dto';
import { MessageResponse } from './dto/message-response.dto';
import { RoomResponse } from './dto/room-response.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import type { Message } from './repositories/messages.repository';
import type { Room } from './repositories/rooms.repository.interface';
import { RoomsService } from './rooms.service';

function toRoomResponse(room: Room): RoomResponse {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    hostUid: room.hostUid,
    hostUsername: room.hostUsername,
    isActive: room.isActive,
    participantCount: room.participantCount,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

function toMessageResponse(msg: Message): MessageResponse {
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderUid: msg.senderUid,
    senderUsername: msg.senderUsername,
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
  };
}

@ApiTags('rooms')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('ice-config')
  @ApiOperation({ summary: 'Get ICE server configuration for WebRTC (call before joining a room)' })
  @ApiOkResponse({ type: IceConfigResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  getIceConfig(): IceConfigResponse {
    const iceServers: IceServerDto[] = [
      { urls: 'stun:stun.l.google.com:19302' },
    ];

    const turnUrls = process.env['TURN_URLS'];
    const turnUsername = process.env['TURN_USERNAME'];
    const turnCredential = process.env['TURN_CREDENTIAL'];

    if (turnUrls && turnUsername && turnCredential) {
      for (const url of turnUrls.split(',').map((u) => u.trim()).filter(Boolean)) {
        iceServers.push({ urls: url, username: turnUsername, credential: turnCredential });
      }
    }

    return { iceServers };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new study room' })
  @ApiCreatedResponse({ type: RoomResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiNotFoundResponse({ description: 'Host profile not found' })
  async createRoom(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomResponse> {
    const host = await this.usersService.findByUid(user.uid);
    if (!host) throw new NotFoundException('User profile not found');
    const room = await this.roomsService.createRoom(host, dto);
    return toRoomResponse(room);
  }

  @Get()
  @ApiOperation({ summary: 'List own rooms (hosted by the current user)' })
  @ApiOkResponse({ type: [RoomResponse] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  async getOwnRooms(@CurrentUser() user: DecodedIdToken): Promise<RoomResponse[]> {
    const rooms = await this.roomsService.getOwnRooms(user.uid);
    return rooms.map(toRoomResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiParam({ name: 'id', example: 'abc123' })
  @ApiOkResponse({ type: RoomResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  async getRoom(@Param('id') id: string): Promise<RoomResponse> {
    const room = await this.roomsService.getRoom(id);
    return toRoomResponse(room);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit room name (host only)' })
  @ApiParam({ name: 'id', example: 'abc123' })
  @ApiOkResponse({ type: RoomResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiForbiddenResponse({ description: 'Only the host can edit this room' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  async updateRoom(
    @Param('id') id: string,
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: UpdateRoomDto,
  ): Promise<RoomResponse> {
    const room = await this.roomsService.updateRoom(id, user.uid, dto);
    return toRoomResponse(room);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room (host only)' })
  @ApiParam({ name: 'id', example: 'abc123' })
  @ApiNoContentResponse({ description: 'Room deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiForbiddenResponse({ description: 'Only the host can delete this room' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  async deleteRoom(
    @Param('id') id: string,
    @CurrentUser() user: DecodedIdToken,
  ): Promise<void> {
    await this.roomsService.deleteRoom(id, user.uid);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat history for a room (last 50 messages, chronological)' })
  @ApiParam({ name: 'id', example: 'abc123' })
  @ApiOkResponse({ type: [MessageResponse] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  async getMessages(@Param('id') id: string): Promise<MessageResponse[]> {
    // Verify room exists before fetching messages
    await this.roomsService.getRoom(id);
    const messages = await this.roomsService.getMessages(id);
    return messages.map(toMessageResponse);
  }
}
