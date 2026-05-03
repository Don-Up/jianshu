import { IsNotEmpty, IsOptional, IsString, IsUrl, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
