import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users.entity';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => UserProfileService))
    private userProfileService: UserProfileService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    await this.usersRepository.save(user);
    
    await this.userProfileService.createProfile(user.id, {});
    
    return user;
  }
}
