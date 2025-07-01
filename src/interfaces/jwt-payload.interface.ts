import { UserRole } from "src/user/entities/user.entity"

export interface JwtPayload {
  sub: string // user id
  email: string
  walletAddress: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    walletAddress: string
    username?: string
    role: UserRole
    emailVerified: boolean
  }
  accessToken: string
  refreshToken: string
}
