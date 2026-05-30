import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import {
  toUserProfileResponse,
  UserProfileResponse,
} from '../common/types/index';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('username/:username/available')
  @ApiOperation({ summary: 'Check if a username is available' })
  @ApiParam({ name: 'username', example: 'juanp99' })
  @ApiOkResponse({
    schema: {
      properties: {
        available: { type: 'boolean' },
        username: { type: 'string' },
      },
    },
  })
  async checkUsernameAvailability(
    @Param('username') username: string,
  ): Promise<{ available: boolean; username: string }> {
    const available = await this.usersService.isUsernameAvailable(username);
    return { available, username };
  }

  @Patch('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase')
  @ApiOperation({
    summary: 'Update own profile (firstName, lastName, avatarUrl)',
  })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiNotFoundResponse({ description: 'User profile not found in Firestore' })
  async updateProfile(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const updated = await this.usersService.updateProfile(user.uid, dto);
    return toUserProfileResponse(updated);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase')
  @ApiOperation({ summary: 'Get own Firestore profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token' })
  @ApiNotFoundResponse({ description: 'User profile not found in Firestore' })
  async getMe(
    @CurrentUser() user: DecodedIdToken,
  ): Promise<UserProfileResponse> {
    const profile = await this.usersService.findByUid(user.uid);
    if (!profile) throw new NotFoundException('User profile not found');
    return toUserProfileResponse(profile);
  }
}
