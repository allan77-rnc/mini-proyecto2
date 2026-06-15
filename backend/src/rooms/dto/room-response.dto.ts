import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() hostUid!: string;
  @ApiProperty() hostUsername!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() participantCount!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
