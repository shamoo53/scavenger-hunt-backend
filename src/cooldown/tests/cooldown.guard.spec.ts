import { Test, type TestingModule } from "@nestjs/testing"
import { ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { ExecutionContext } from "@nestjs/common"
import { CooldownGuard } from "../guards/cooldown.guard"
import { CooldownService } from "../services/cooldown.service"
import { jest } from "@jest/globals"

describe("CooldownGuard", () => {
  let guard: CooldownGuard
  let cooldownService: CooldownService
  let reflector: Reflector

  const mockCooldownService = {
    canUserAttemptPuzzle: jest.fn(),
    getRemainingCooldownTime: jest.fn(),
  }

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooldownGuard,
        {
          provide: CooldownService,
          useValue: mockCooldownService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile()

    guard = module.get<CooldownGuard>(CooldownGuard)
    cooldownService = module.get<CooldownService>(CooldownService)
    reflector = module.get<Reflector>(Reflector)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockExecutionContext = (body: any = {}, params: any = {}, headers: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          params,
          headers,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  describe("canActivate", () => {
    it("should allow access when cooldown is skipped", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true)

      const context = createMockExecutionContext()
      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockCooldownService.canUserAttemptPuzzle).not.toHaveBeenCalled()
    })

    it("should allow access when user can attempt puzzle", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(true)

      const context = createMockExecutionContext({ userId: "user-123", puzzleId: "puzzle-123" }, {}, {})

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockCooldownService.canUserAttemptPuzzle).toHaveBeenCalledWith("user-123", "puzzle-123")
    })

    it("should deny access when user cannot attempt puzzle due to cooldown", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(false)
      mockCooldownService.getRemainingCooldownTime.mockResolvedValue(1800) // 30 minutes

      const context = createMockExecutionContext({ userId: "user-123", puzzleId: "puzzle-123" }, {}, {})

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
      expect(mockCooldownService.getRemainingCooldownTime).toHaveBeenCalledWith("user-123", "puzzle-123")
    })

    it("should deny access when max attempts reached", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(false)
      mockCooldownService.getRemainingCooldownTime.mockResolvedValue(Number.POSITIVE_INFINITY)

      const context = createMockExecutionContext({ userId: "user-123", puzzleId: "puzzle-123" }, {}, {})

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException("Maximum attempts reached for this puzzle"),
      )
    })

    it("should throw ForbiddenException when userId or puzzleId is missing", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)

      const context = createMockExecutionContext({}, {}, {})

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException("User ID and Puzzle ID are required for cooldown check"),
      )
    })

    it("should get userId and puzzleId from params", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(true)

      const context = createMockExecutionContext({}, { userId: "user-456", puzzleId: "puzzle-456" }, {})

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockCooldownService.canUserAttemptPuzzle).toHaveBeenCalledWith("user-456", "puzzle-456")
    })

    it("should get userId from headers", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false)
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(true)

      const context = createMockExecutionContext({ puzzleId: "puzzle-789" }, {}, { "x-user-id": "user-789" })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockCooldownService.canUserAttemptPuzzle).toHaveBeenCalledWith("user-789", "puzzle-789")
    })
  })
})
