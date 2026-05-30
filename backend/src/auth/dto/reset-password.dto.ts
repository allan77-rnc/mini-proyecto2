import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'juan@universidad.edu' })
  @IsEmail()
  email!: string;
}
