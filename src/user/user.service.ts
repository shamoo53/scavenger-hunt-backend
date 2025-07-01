import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { Repository } from "typeorm"
import { User, UserRole, UserStatus } from "./entities/user.entity"
import { UpdateProfileDto, UserResponseDto } from "./dto/user.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.findById(userId)
    return this.mapToResponseDto(user)
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.findById(userId)

    // Check username uniqueness if being updated
    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      })

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException("Username already taken")
      }
    }

    // Update user fields
    Object.assign(user, updateProfileDto)
    const updatedUser = await this.userRepository.save(user)

    return this.mapToResponseDto(updatedUser)
  }

  async uploadAvatar(userId: string, avatarUrl: string): Promise<UserResponseDto> {
    const user = await this.findById(userId)
    user.avatarUrl = avatarUrl
    const updatedUser = await this.userRepository.save(user)

    return this.mapToResponseDto(updatedUser)
  }

  async getAllUsers(
    page = 1,
    limit = 10,
  ): Promise<{
    users: UserResponseDto[]
    total: number
    page: number
    totalPages: number
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    })

    return {
      users: users.map((user) => this.mapToResponseDto(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<UserResponseDto> {
    const user = await this.findById(userId)
    user.status = status
    const updatedUser = await this.userRepository.save(user)

    return this.mapToResponseDto(updatedUser)
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.findById(userId)
    user.role = role
    const updatedUser = await this.userRepository.save(user)

    return this.mapToResponseDto(updatedUser)
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId)
    await this.userRepository.remove(user)
  }

  async getUserStats(): Promise<{
    totalUsers: number
    activeUsers: number
    playersCount: number
    adminsCount: number
  }> {
    const [totalUsers, activeUsers, playersCount, adminsCount] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepository.count({ where: { role: UserRole.PLAYER } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ])

    return {
      totalUsers,
      activeUsers,
      playersCount,
      adminsCount,
    }
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
