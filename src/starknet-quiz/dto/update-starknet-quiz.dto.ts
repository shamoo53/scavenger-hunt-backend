// src/starknet-quiz/dto/update-starknet-quiz.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateStarknetQuizDto } from './create-starknet-quiz.dto';

export class UpdateStarknetQuizDto extends PartialType(CreateStarknetQuizDto) {}