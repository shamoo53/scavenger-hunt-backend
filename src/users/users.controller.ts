import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

// Authentication Guard, Admin-only Guard
// import { AuthGuard, AdminGuard } from '../auth/auth.controller';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseGuards(AuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  // @UseGuards(AuthGuard)
  @Get('profile/me')
  async getProfile(@Req() req) {
    // Temporary fallback userId for testing purposes (to be removed once AuthGuard is implemented)
    const userId = req.user?.id || 'b7f89c2d-3e7a-4d12-a4f5-8c6d7e9b1a23';

    return this.usersService.findById(userId);
  }

  // @UseGuards(AuthGuard)
  @Put('profile/me')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    // Temporary fallback userId for testing purposes (to be removed once AuthGuard is implemented)
    const userId = req.user?.id || 'b7f89c2d-3e7a-4d12-a4f5-8c6d7e9b1a23';
    return this.usersService.update(userId, updateUserDto);
  }

  @Get('wallet/:walletAddress')
  async findByWalletAddress(@Param('walletAddress') address: string) {
    return this.usersService.findByWalletAddress(address);
  }

  @Post('wallet/:walletAddress')
  async createFromWallet(@Param('walletAddress') address: string) {
    return this.usersService.createFromWallet(address);
  }
}
