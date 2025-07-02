import { Controller, Post, HttpCode, HttpStatus, Get, Query, UseGuards, Request } from "@nestjs/common"
import { AuthService } from "../services/auth.service"
import {
  RegisterDto,
  LoginDto,
  WalletAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto"
import { Public } from "../decorators/auth.decorators"
import { JwtAuthGuard } from "../guards/jwt-auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  async register(registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Public()
  @Post("wallet-auth")
  @HttpCode(HttpStatus.OK)
  async walletAuth(walletAuthDto: WalletAuthDto) {
    return this.authService.walletAuth(walletAuthDto)
  }

  @Public()
  @Get('wallet-message')
  async getWalletAuthMessage(@Query('walletAddress') walletAddress: string) {
    return this.authService.generateWalletAuthMessage(walletAddress);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto)
    return { message: "Password reset email sent if account exists" }
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto)
    return { message: "Password reset successfully" }
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, changePasswordDto)
    return { message: "Password changed successfully" }
  }
}
