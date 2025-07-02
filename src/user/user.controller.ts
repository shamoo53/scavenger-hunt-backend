import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { diskStorage } from "multer"
import { extname } from "path"
import type { Express } from "express"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { RolesGuard } from "src/auth/guards/roles.guard"
import { UserService } from "./user.service"
import { UserRole, UserStatus } from "./entities/user.entity"
import { Roles } from "src/auth/decorators/auth.decorators"
import { UpdateProfileDto } from "./dto/user.dto"

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  async getProfile(req: Express.Request) {
    return this.userService.getProfile(req.user.id)
  }

  @Put("profile")
  async updateProfile(req: Express.Request, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, updateProfileDto)
  }

  @Post("avatar")
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: diskStorage({
        destination: "./uploads/avatars",
        filename: (req: Express.Request, file, callback) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
          const ext = extname(file.originalname)
          callback(null, `avatar-${uniqueSuffix}${ext}`)
        },
      }),
      fileFilter: (req: Express.Request, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException("Only image files are allowed"), false)
        }
        callback(null, true)
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(req: Express.Request, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded")
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`
    return this.userService.uploadAvatar(req.user.id, avatarUrl)
  }

  // Admin only endpoints
  @Get()
  @Roles(UserRole.ADMIN)
  async getAllUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.userService.getAllUsers(page, limit)
  }

  @Get("stats")
  @Roles(UserRole.ADMIN)
  async getUserStats() {
    return this.userService.getUserStats()
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getProfile(id);
  }

  @Put(":id/status")
  @Roles(UserRole.ADMIN)
  async updateUserStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: UserStatus) {
    return this.userService.updateUserStatus(id, status)
  }

  @Put(":id/role")
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id', ParseUUIDPipe) id: string, @Body('role') role: UserRole) {
    return this.userService.updateUserRole(id, role)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
