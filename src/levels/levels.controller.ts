import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseIntPipe } from "@nestjs/common"
import type { LevelsService } from "./levels.service"
import type { CreateLevelDto } from "./dto/create-level.dto"
import type { UpdateLevelDto } from "./dto/update-level.dto"
import type { Level } from "./entities/level.entity"

@Controller("levels")
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  findAll(): Promise<Level[]> {
    return this.levelsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Level> {
    return this.levelsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLevelDto: CreateLevelDto): Promise<Level> {
    return this.levelsService.create(createLevelDto);
  }

  @Patch(":id")
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLevelDto: UpdateLevelDto): Promise<Level> {
    return this.levelsService.update(id, updateLevelDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.levelsService.remove(id);
  }
}
