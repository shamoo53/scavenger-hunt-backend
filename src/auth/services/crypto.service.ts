import { Injectable } from "@nestjs/common"
import * as bcrypt from "bcrypt"
import * as crypto from "crypto"

@Injectable()
export class CryptoService {
  private readonly saltRounds = 12

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  generateNonce(): string {
    return crypto.randomBytes(16).toString("hex")
  }

  createHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex")
  }
}
