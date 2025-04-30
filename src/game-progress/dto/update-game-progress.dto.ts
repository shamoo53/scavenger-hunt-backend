import { PartialType } from '@nestjs/swagger';
import { CreateGameProgressDto } from './create-game-progress.dto';

export class UpdateGameProgressDto extends PartialType(CreateGameProgressDto) {}
