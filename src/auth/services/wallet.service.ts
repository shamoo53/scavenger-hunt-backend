import { Injectable, BadRequestException } from "@nestjs/common"
import { ec } from "starknet"
import { Buffer } from 'buffer';


@Injectable()
export class WalletService {
  async verifySignature(
  walletAddress: string,
  message: string,
  signature: string,
  nonce: string
): Promise<boolean> {
  try {
    const messageHash = this.createMessageHash(message, nonce)

    const [r, s] = this.parseSignature(signature)

    const publicKey = this.derivePublicKeyFromAddress(walletAddress)

    // Convert bigint to string to match expected type

// ...

const isValid = ec.starkCurve.verify(
  publicKey,
  messageHash,
  Buffer.from(r.toString() + s.toString(), 'hex')
);

    return isValid
  } catch (error) {
    throw new BadRequestException("Invalid signature format or verification failed")
  }
}


  generateAuthMessage(walletAddress: string, nonce: string): string {
    const timestamp = Date.now()
    return `Sign this message to authenticate with NFT Scavenger Hunt Game.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger any blockchain transaction or cost any gas fees.`
  }

  /**
   * Create message hash using StarkNet pedersen hash (hex strings only)
   */
  private createMessageHash(message: string, nonce: string): string {
    const fullMessage = `${message}\nNonce: ${nonce}`
    const hex = Buffer.from(fullMessage).toString("hex")
    const hexWithPrefix = `0x${hex}`
    return ec.starkCurve.pedersen("0x00", hexWithPrefix)
  }

  /**
   * Parse signature string into [r, s] as bigint tuple
   */
  private parseSignature(signature: string): [bigint, bigint] {
    const clean = signature.startsWith("0x") ? signature.slice(2) : signature
    if (clean.length !== 128) {
      throw new BadRequestException("Invalid signature length")
    }
    const r = BigInt("0x" + clean.slice(0, 64))
    const s = BigInt("0x" + clean.slice(64, 128))
    return [r, s]
  }

  /**
   * Derive public key from wallet address (assuming it's already the public key in hex)
   */
  private derivePublicKeyFromAddress(walletAddress: string): string {
    // Convert to proper hex format (if needed)
    return walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`
  }

  isValidWalletAddress(address: string): boolean {
    const clean = address.startsWith("0x") ? address.slice(2) : address
    return /^[a-fA-F0-9]{40,64}$/.test(clean)
  }
}
