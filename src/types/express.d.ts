import { UserRole } from "../user/entities/user.entity"

declare global {
  namespace Express {
    interface User {
      id: string
      email?: string
      role?: UserRole
    }

    interface Request {
      user: User
    }
  }
}
