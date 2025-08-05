// src/puzzle-timers/dto/update-puzzle-timer.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreatePuzzleTimerDto } from './create-puzzle-timer.dto';

export class UpdatePuzzleTimerDto extends PartialType(CreatePuzzleTimerDto) {}