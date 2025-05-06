import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
    const userId = req.user.id;
    return this.notificationsService.findAllForUser(userId, skip, take);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.findUnreadCountForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    if (updateNotificationDto.read) {
      return this.notificationsService.markAsRead(id);
    }
    return { message: 'No changes applied' };
  }

  @Post('mark-all-read')
  markAllRead(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsReadForUser(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.deleteOne(id);
  }
}