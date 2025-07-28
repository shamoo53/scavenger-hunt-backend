import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post()
  create(@Body() dto: CreateSeasonDto) {
    return this.seasonsService.create(dto);
  }

  @Get()
  findAll() {
    return this.seasonsService.findAll();
  }

  @Get('current')
  getCurrent() {
    return this.seasonsService.getCurrentSeason();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seasonsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeasonDto) {
    return this.seasonsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seasonsService.remove(id);
  }
}
