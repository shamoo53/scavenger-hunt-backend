import { Injectable, BadRequestException } from '@nestjs/common';
// import { ec } from 'starknet'; // Commented out until starknet is installed

@Injectable()
export class WalletService {
  async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      // TODO: Implement wallet signature verification
      // This is a placeholder implementation
      console.log('Verifying wallet signature:', {
        walletAddress,
        message,
        signature,
      });

      // For now, return true for development
      // In production, implement proper signature verification
      return true;
    } catch (error) {
      throw new BadRequestException('Invalid wallet signature');
    }
  }

  generateNonce(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  isValidWalletAddress(address: string): boolean {
    // Basic validation - adjust based on your wallet type
    return address && address.length > 10 && address.startsWith('0x');
  }
}
