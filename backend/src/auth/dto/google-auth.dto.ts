import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description:
      'Firebase ID token obtained from the Google sign-in popup on the frontend',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...',
  })
  @IsString()
  idToken!: string;
}
