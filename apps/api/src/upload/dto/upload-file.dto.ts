import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ example: '/uploads/1234567890-image.jpg' })
  url!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimetype!: string;

  @ApiProperty({ example: 1234567 })
  size!: number;
}
