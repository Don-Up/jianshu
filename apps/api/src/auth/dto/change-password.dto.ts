import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword!: string;
}