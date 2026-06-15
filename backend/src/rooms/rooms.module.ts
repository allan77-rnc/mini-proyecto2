import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { MessagesRepository } from './repositories/messages.repository';
import { RoomsRepository } from './repositories/rooms.repository';
import { ROOMS_REPOSITORY } from './repositories/rooms.repository.interface';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  imports: [FirebaseModule, UsersModule],
  providers: [
    RoomsService,
    MessagesRepository,
    RoomsGateway,
    { provide: ROOMS_REPOSITORY, useClass: RoomsRepository },
  ],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
