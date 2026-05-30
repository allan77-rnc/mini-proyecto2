import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Module({
  imports: [UsersModule],
  providers: [AuthService, FirebaseAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
