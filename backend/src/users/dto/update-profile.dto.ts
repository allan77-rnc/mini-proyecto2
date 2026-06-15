import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan', minLength: 2, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez', minLength: 2, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'juanp99_new',
    description: '3–20 chars, letters/numbers/underscores/hyphens',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
    message: 'Username must be 3–20 characters: letters, numbers, underscores or hyphens only',
  })
  username?: string;

  @ApiPropertyOptional({
    example: 'nuevo@universidad.edu.co',
    description: 'Must be an institutional email (.edu domain)',
  })
  @IsOptional()
  @IsEmail()
  @Matches(/^[^@]+@[^@]+\.edu(\.[a-z]{2,})?$/i, {
    message: 'Only institutional email addresses are allowed',
  })
  email?: string;
}
