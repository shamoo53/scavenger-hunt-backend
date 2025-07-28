import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateTriviaDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsBoolean()
  isPublic: boolean;
}

