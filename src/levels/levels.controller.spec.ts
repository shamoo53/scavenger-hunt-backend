import { Test, type TestingModule } from "@nestjs/testing"
import { LevelsController } from "./levels.controller"
import { LevelsService } from "./levels.service"
import type { CreateLevelDto } from "./dto/create-level.dto"
import type { UpdateLevelDto } from "./dto/update-level.dto"
import { Level } from "./entities/level.entity"

describe("LevelsController", () => {
  let controller: LevelsController
  let service: LevelsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LevelsController],
      providers: [
        {
          provide: LevelsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<LevelsController>(LevelsController)
    service = module.get<LevelsService>(LevelsService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("findAll", () => {
    it("should return an array of levels", async () => {
      const result = [new Level()]
      jest.spyOn(service, "findAll").mockResolvedValue(result)

      expect(await controller.findAll()).toBe(result)
    })
  })

  describe("findOne", () => {
    it("should return a single level", async () => {
      const result = new Level()
      jest.spyOn(service, "findOne").mockResolvedValue(result)

      expect(await controller.findOne(1)).toBe(result)
      expect(service.findOne).toHaveBeenCalledWith(1)
    })
  })

  describe("create", () => {
    it("should create a level", async () => {
      const createLevelDto: CreateLevelDto = { title: "New Level" }
      const result = new Level()
      jest.spyOn(service, "create").mockResolvedValue(result)

      expect(await controller.create(createLevelDto)).toBe(result)
      expect(service.create).toHaveBeenCalledWith(createLevelDto)
    })
  })

  describe("update", () => {
    it("should update a level", async () => {
      const updateLevelDto: UpdateLevelDto = { title: "Updated Level" }
      const result = new Level()
      jest.spyOn(service, "update").mockResolvedValue(result)

      expect(await controller.update(1, updateLevelDto)).toBe(result)
      expect(service.update).toHaveBeenCalledWith(1, updateLevelDto)
    })
  })

  describe("remove", () => {
    it("should remove a level", async () => {
      jest.spyOn(service, "remove").mockResolvedValue(undefined)

      expect(await controller.remove(1)).toBeUndefined()
      expect(service.remove).toHaveBeenCalledWith(1)
    })
  })
})
