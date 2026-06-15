import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty() id!: string;
  @ApiProperty() roomId!: string;
  @ApiProperty() senderUid!: string;
  @ApiProperty() senderUsername!: string;
  @ApiProperty() text!: string;
  @ApiProperty() createdAt!: string;
}
