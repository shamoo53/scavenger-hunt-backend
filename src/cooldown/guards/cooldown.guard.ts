import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { CooldownService } from "../services/cooldown.service"

export const SKIP_COOLDOWN_KEY = "skipCooldown"
export const SkipCooldown = () => Reflector.createDecorator<boolean>()

@Injectable()
export class CooldownGuard implements CanActivate {
  constructor(
    private readonly cooldownService: CooldownService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if cooldown should be skipped for this endpoint
    const skipCooldown = this.reflector.getAllAndOverride<boolean>(SKIP_COOLDOWN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipCooldown) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const userId = request.body?.userId || request.params?.userId || request.headers["x-user-id"]
    const puzzleId = request.body?.puzzleId || request.params?.puzzleId

    if (!userId || !puzzleId) {
      throw new ForbiddenException("User ID and Puzzle ID are required for cooldown check")
    }

    // Check if user can attempt the puzzle
    const canAttempt = await this.cooldownService.canUserAttemptPuzzle(userId, puzzleId)

    if (!canAttempt) {
      const remainingTime = await this.cooldownService.getRemainingCooldownTime(userId, puzzleId)

      if (remainingTime === Number.POSITIVE_INFINITY) {
        throw new ForbiddenException("Maximum attempts reached for this puzzle")
      }

      const hours = Math.floor(remainingTime / 3600)
      const minutes = Math.floor((remainingTime % 3600) / 60)
      const seconds = remainingTime % 60

      let timeString = ""
      if (hours > 0) timeString += `${hours}h `
      if (minutes > 0) timeString += `${minutes}m `
      if (seconds > 0 || timeString === "") timeString += `${seconds}s`

      throw new ForbiddenException(`Puzzle is on cooldown. Try again in ${timeString.trim()}`)
    }

    return true
  }
}
