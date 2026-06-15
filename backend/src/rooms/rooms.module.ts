import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { RoomsRepository } from './repositories/rooms.repository';
import { ROOMS_REPOSITORY } from './repositories/rooms.repository.interface';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [FirebaseModule, UsersModule],
  providers: [
    RoomsService,
    { provide: ROOMS_REPOSITORY, useClass: RoomsRepository },
  ],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
