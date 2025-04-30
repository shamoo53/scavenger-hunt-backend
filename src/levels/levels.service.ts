import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Level } from "./entities/level.entity"
import type { CreateLevelDto } from "./dto/create-level.dto"
import type { UpdateLevelDto } from "./dto/update-level.dto"

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private levelsRepository: Repository<Level>,
  ) {}

  async findAll(): Promise<Level[]> {
    return this.levelsRepository.find({
      order: {
        order: "ASC",
      },
    })
  }

  asyncnc
  findOne(id: number): Promise<Level> {
    const level = await this.levelsRepository.findOne({ where: { id } })

    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`)
    }

    return level
  }

  async create(createLevelDto: CreateLevelDto): Promise<Level> {
    const level = this.levelsRepository.create(createLevelDto)
    return this.levelsRepository.save(level)
  }

  async update(id: number, updateLevelDto: UpdateLevelDto): Promise<Level> {
    const level = await this.findOne(id)

    // Update the level with the new values
    Object.assign(level, updateLevelDto)

    return this.levelsRepository.save(level)
  }

  async remove(id: number): Promise<void> {
    const level = await this.findOne(id)
    await this.levelsRepository.remove(level)
  }
}
