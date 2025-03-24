import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfileService } from './providers/user-profile.service';
import { CreateProfileDto } from './dtos/create-profile.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './users.entity';
import { storageConfig } from '../common/config/storage.config';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { plainToClass } from 'class-transformer';

@Controller('users')
export class UsersController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getMyProfile(@CurrentUser() user: User) {
    const profile = await this.userProfileService.getProfileByUserId(user.id, user.id);
    return plainToClass(ProfileResponseDto, profile, { excludeExtraneousValues: true });
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.userProfileService.updateProfile(user.id, updateProfileDto);
    return plainToClass(ProfileResponseDto, profile, { excludeExtraneousValues: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar', storageConfig))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `${process.env.API_URL || 'http://localhost:3000'}/uploads/avatars/${file.filename}`;
    const profile = await this.userProfileService.updateAvatar(user.id, avatarUrl);
    return plainToClass(ProfileResponseDto, profile, { excludeExtraneousValues: true });
  }

  @Get('profile/:id')
  async getUserProfile(
    @Param('id') userId: string,
    @CurrentUser() currentUser?: User,
  ) {
    const profile = await this.userProfileService.getProfileByUserId(
      userId,
      currentUser?.id,
    );
    return plainToClass(ProfileResponseDto, profile, { excludeExtraneousValues: true });
  }
}
