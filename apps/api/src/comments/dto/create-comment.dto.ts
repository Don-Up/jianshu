import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MaxLength(2000, { message: '评论最多2000字' })
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string; // for nested replies
}
