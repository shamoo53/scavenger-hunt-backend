import { Type } from 'class-transformer';
import { IsOptional, IsInt } from 'class-validator';

export class GetPostsParamsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;
}
