import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBookmarkDto } from './create-bookmark.dto';

export class UpdateBookmarkDto extends PartialType(
  OmitType(CreateBookmarkDto, ['playerId', 'itemId', 'type'] as const)
) {}
