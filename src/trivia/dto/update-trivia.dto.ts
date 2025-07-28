import { PartialType } from '@nestjs/mapped-types';
import { CreateTriviaDto } from './create-trivia.dto';

export class UpdateTriviaDto extends PartialType(CreateTriviaDto) {}
