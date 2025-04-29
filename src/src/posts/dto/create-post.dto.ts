import { CreateUsersDto } from 'src/users/dto/create-user.dto';
import { postStatus } from '../enums/post-status.enum';
import { postType } from '../enums/post-types.enum';
import {
  IsString,
  IsDate,
  MinLength,
  IsEnum,
  IsOptional,
  IsISO8601,
  IsArray,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(4)
  title: string;

  @IsEnum(CreateUsersDto)
  author: CreateUsersDto;

  @IsEnum(postType)
  postType: postType;

  @IsEnum(postStatus)
  postStatus: postStatus;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @IsDate()
  @IsISO8601()
  publishedDate: Date;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
