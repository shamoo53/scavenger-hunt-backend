import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { VerifyPuzzleDto } from './dto/verify-puzzle.dto';
import { User } from 'src/users/users.entity';

@Injectable()
export class PuzzlesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
  ) {}

  async verifyPuzzle(userId: string, verifyPuzzleDto: VerifyPuzzleDto) {
    const { puzzleId, answer } = verifyPuzzleDto;

    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    });
    if (!puzzle) throw new NotFoundException('Puzzle not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user) {
      throw new BadRequestException('Puzzle already solved');
    }

    if (puzzle.answer.trim().toLowerCase() !== answer.trim().toLowerCase()) {
      throw new BadRequestException('Incorrect answer');
    }

    await this.userRepository.save(user);

    return {
      message: `Congratulations! Puzzle solved! 🎉 You earned ${puzzle.pointsAwarded} points.`,
    };
  }
}
