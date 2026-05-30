import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    example: 'juanp99',
    description: '3–20 chars, letters/numbers/underscores/hyphens',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
    message:
      'Username must be 3–20 characters: letters, numbers, underscores or hyphens only',
  })
  username!: string;

  @ApiProperty({ example: 'juan@universidad.edu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MySecurePass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
