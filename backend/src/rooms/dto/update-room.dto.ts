import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoomDto {
  @ApiProperty({ example: 'Cálculo II — Segundo parcial', minLength: 3, maxLength: 80 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Room name cannot be empty or whitespace' })
  @MinLength(3)
  @MaxLength(80)
  name!: string;
}
