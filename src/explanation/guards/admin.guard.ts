import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from "@nestjs/common"

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user || request.headers["x-user-id"]
    const userRole = request.headers["x-user-role"]

    // In a real application, this would check against a user service or JWT token
    // For this standalone module, we'll check a header value
    if (!user) {
      throw new ForbiddenException("User authentication required")
    }

    if (userRole !== "admin") {
      throw new ForbiddenException("Admin access required")
    }

    return true
  }
}
