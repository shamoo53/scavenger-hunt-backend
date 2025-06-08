import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { UpdateCronJobDto } from './dto/update-cron-job.dto';

// Assuming you have an AdminGuard for admin-only routes
// @UseGuards(AdminGuard)
@Controller('admin/cronjob')
export class CronjobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Post()
  create(@Body() createPuzzleDto: CreateCronJobDto) {
    return this.cronJobService.create(createPuzzleDto);
  }

  @Get()
  findAll() {
    return this.cronJobService.findAll();
  }

  @Get('active')
  findActive() {
    return this.cronJobService.findActive();
  }

  @Get('scheduled')
  getScheduledPuzzles() {
    return this.cronJobService.getScheduledPuzzles();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cronJobService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePuzzleDto: UpdateCronJobDto,
  ) {
    return this.cronJobService.update(id, updatePuzzleDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cronJobService.remove(id);
  }

  @Post('activate-scheduled')
  manualActivation() {
    return this.cronJobService.manualActivation();
  }
}
