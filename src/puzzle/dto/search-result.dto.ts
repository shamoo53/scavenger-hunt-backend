import { Puzzle } from '../entities/puzzle.entity';

export class SearchResultDto {
  data: Puzzle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
