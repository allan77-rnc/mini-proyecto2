import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IceServerDto {
  @ApiProperty({ example: 'stun:stun.l.google.com:19302' })
  urls!: string;

  @ApiPropertyOptional({ example: 'myuser' })
  username?: string;

  @ApiPropertyOptional({ example: 'mypassword' })
  credential?: string;
}

export class IceConfigResponse {
  @ApiProperty({ type: [IceServerDto] })
  iceServers!: IceServerDto[];
}
