import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CompleteProfileDto {
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

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;
}
