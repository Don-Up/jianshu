import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  comment?: boolean;

  @IsOptional()
  @IsBoolean()
  like?: boolean;

  @IsOptional()
  @IsBoolean()
  follow?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;
}
