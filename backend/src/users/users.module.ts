import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersRepository } from './repositories/users.repository';
import { USERS_REPOSITORY } from './repositories/users.repository.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FirebaseModule],
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
