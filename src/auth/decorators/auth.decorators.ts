import { SetMetadata } from "@nestjs/common"
import { UserRole } from "src/user/entities/user.entity"

export const Public = () => SetMetadata("isPublic", true)
export const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles)
