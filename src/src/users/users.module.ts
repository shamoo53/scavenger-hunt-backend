import { Module } from '@nestjs/common';
import { UsersControllers } from './users.controllers';
import { UsersService } from './providers/users.services';

@Module({
  controllers: [UsersControllers],
  providers: [UsersService],
})
export class UsersModule {}
