import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(private readonly configService: ConfigService) {}


  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${resetToken}`

      // In a real implementation, you would use a service like SendGrid, AWS SES, etc.
      // For now, we'll just log the email content
      const emailContent = {
        to: email,
        subject: "Password Reset - NFT Scavenger Hunt Game",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password for NFT Scavenger Hunt Game.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        `,
      }

      this.logger.log(`Password reset email would be sent to: ${email}`)
      this.logger.log(`Reset URL: ${resetUrl}`)

      // TODO: Implement actual email sending logic here
      // await this.emailProvider.send(emailContent);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error)
      throw error
    }
  }

  async sendWelcomeEmail(email: string, username?: string): Promise<void> {
    try {
      const emailContent = {
        to: email,
        subject: "Welcome to NFT Scavenger Hunt Game!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to NFT Scavenger Hunt Game!</h2>
            <p>Hello ${username || "Player"},</p>
            <p>Thank you for joining our NFT Scavenger Hunt Game! Your account has been successfully created.</p>
            <p>You can now start exploring and participating in exciting scavenger hunts.</p>
            <p>Happy hunting!</p>
          </div>
        `,
      }

      this.logger.log(`Welcome email would be sent to: ${email}`)

      // TODO: Implement actual email sending logic here
      // await this.emailProvider.send(emailContent);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error)
      throw error
    }
  }
}
