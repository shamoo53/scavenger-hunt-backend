import { Test, type TestingModule } from "@nestjs/testing"
import { ForbiddenException } from "@nestjs/common"
import type { ExecutionContext } from "@nestjs/common"
import { AdminGuard } from "../guards/admin.guard"

describe("AdminGuard", () => {
  let guard: AdminGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile()

    guard = module.get<AdminGuard>(AdminGuard)
  })

  const createMockExecutionContext = (headers: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: headers["x-user-id"],
          headers,
        }),
      }),
    } as ExecutionContext
  }

  describe("canActivate", () => {
    it("should allow access for admin users", () => {
      const context = createMockExecutionContext({
        "x-user-id": "admin-123",
        "x-user-role": "admin",
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should throw ForbiddenException when user is not authenticated", () => {
      const context = createMockExecutionContext({})

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when user is not admin", () => {
      const context = createMockExecutionContext({
        "x-user-id": "user-123",
        "x-user-role": "user",
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when user role is missing", () => {
      const context = createMockExecutionContext({
        "x-user-id": "user-123",
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })
  })
})
