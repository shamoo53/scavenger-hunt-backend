import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { LevelsService } from "./levels.service"
import { Level } from "./entities/level.entity"
import { NotFoundException } from "@nestjs/common"

describe("LevelsService", () => {
  let service: LevelsService
  let repository: Repository<Level>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LevelsService,
        {
          provide: getRepositoryToken(Level),
          useClass: Repository,
        },
      ],
    }).compile()

    service = module.get<LevelsService>(LevelsService)
    repository = module.get<Repository<Level>>(getRepositoryToken(Level))
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("findAll", () => {
    it("should return an array of levels", async () => {
      const result = [new Level()]
      jest.spyOn(repository, "find").mockResolvedValue(result)

      expect(await service.findAll()).toBe(result)
      expect(repository.find).toHaveBeenCalledWith({
        order: {
          order: "ASC",
        },
      })
    })
  })

  describe("findOne", () => {
    it("should return a level when it exists", async () => {
      const level = new Level()
      level.id = 1
      jest.spyOn(repository, "findOne").mockResolvedValue(level)

      expect(await service.findOne(1)).toBe(level)
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it("should throw NotFoundException when level does not exist", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null)

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException)
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe("create", () => {
    it("should create and return a level", async () => {
      const createLevelDto = { title: "New Level" }
      const level = new Level()
      level.title = "New Level"

      jest.spyOn(repository, "create").mockReturnValue(level)
      jest.spyOn(repository, "save").mockResolvedValue(level)

      expect(await service.create(createLevelDto)).toBe(level)
      expect(repository.create).toHaveBeenCalledWith(createLevelDto)
      expect(repository.save).toHaveBeenCalledWith(level)
    })
  })
})
