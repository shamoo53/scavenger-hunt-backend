import { Injectable } from '@nestjs/common';

export interface StarkNetAddressValidationResult {
  isValid: boolean;
  format?: 'hex' | 'decimal';
  normalizedAddress?: string;
  errors?: string[];
}

@Injectable()
export class StarkNetAddressValidator {
  private readonly HEX_PREFIX = '0x';
  private readonly MIN_ADDRESS_LENGTH = 3; // 0x + at least 1 hex digit
  private readonly MAX_ADDRESS_LENGTH = 66; // 0x + 64 hex digits (256 bits)
  private readonly MAX_DECIMAL_LENGTH = 78; // Max decimal representation of 2^256

  /**
   * Validates a StarkNet wallet address
   * @param address - The address to validate
   * @returns Validation result with details
   */
  public validateAddress(address: string): StarkNetAddressValidationResult {
    // Basic null/undefined check
    if (!address) {
      return {
        isValid: false,
        errors: ['Address is required'],
      };
    }

    // Trim whitespace
    const trimmedAddress = address.trim();

    if (trimmedAddress.length === 0) {
      return {
        isValid: false,
        errors: ['Address cannot be empty'],
      };
    }

    // Check if it's hexadecimal format
    if (this.isHexFormat(trimmedAddress)) {
      return this.validateHexAddress(trimmedAddress);
    }

    // Check if it's decimal format
    if (this.isDecimalFormat(trimmedAddress)) {
      return this.validateDecimalAddress(trimmedAddress);
    }

    return {
      isValid: false,
      errors: [
        'Invalid address format. Must be hexadecimal (0x...) or decimal number',
      ],
    };
  }

  /**
   * Validates multiple addresses at once
   * @param addresses - Array of addresses to validate
   * @returns Array of validation results
   */
  public validateMultipleAddresses(
    addresses: string[],
  ): StarkNetAddressValidationResult[] {
    return addresses.map((address) => this.validateAddress(address));
  }

  /**
   * Checks if all provided addresses are valid
   * @param addresses - Array of addresses to validate
   * @returns True if all addresses are valid
   */
  public areAllAddressesValid(addresses: string[]): boolean {
    return addresses.every((address) => this.validateAddress(address).isValid);
  }

  /**
   * Normalizes a valid address to hexadecimal format
   * @param address - The address to normalize
   * @returns Normalized address or null if invalid
   */
  public normalizeAddress(address: string): string | null {
    const validation = this.validateAddress(address);
    return validation.isValid ? validation.normalizedAddress! : null;
  }

  private isHexFormat(address: string): boolean {
    return address.toLowerCase().startsWith(this.HEX_PREFIX.toLowerCase());
  }

  private isDecimalFormat(address: string): boolean {
    return /^\d+$/.test(address);
  }

  private validateHexAddress(address: string): StarkNetAddressValidationResult {
    const errors: string[] = [];
    const lowerAddress = address.toLowerCase();

    // Check length constraints
    if (lowerAddress.length < this.MIN_ADDRESS_LENGTH) {
      errors.push('Hex address too short');
    }

    if (lowerAddress.length > this.MAX_ADDRESS_LENGTH) {
      errors.push('Hex address too long');
    }

    // Validate hex characters after 0x prefix
    const hexPart = lowerAddress.slice(2);
    if (!/^[0-9a-f]*$/.test(hexPart)) {
      errors.push('Invalid hexadecimal characters');
    }

    // Check if it's all zeros (invalid address)
    if (hexPart.length > 0 && /^0+$/.test(hexPart)) {
      errors.push('Address cannot be zero');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // Normalize: ensure proper case and remove unnecessary leading zeros
    const normalizedHex = this.normalizeHexAddress(lowerAddress);

    return {
      isValid: true,
      format: 'hex',
      normalizedAddress: normalizedHex,
    };
  }

  private validateDecimalAddress(
    address: string,
  ): StarkNetAddressValidationResult {
    const errors: string[] = [];

    // Check length
    if (address.length > this.MAX_DECIMAL_LENGTH) {
      errors.push('Decimal address too long');
    }

    // Check if it's zero
    if (address === '0' || /^0+$/.test(address)) {
      errors.push('Address cannot be zero');
    }

    // Validate it's within the valid range (less than 2^251)
    // StarkNet uses a prime field, so we need to check the maximum value
    try {
      const bigIntAddress = BigInt(address);
      const maxValue = BigInt('2') ** BigInt('251'); // StarkNet field prime is close to 2^251

      if (bigIntAddress >= maxValue) {
        errors.push('Address exceeds maximum allowed value');
      }
    } catch {
      errors.push('Invalid decimal number');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // Convert to normalized hex format
    const bigIntAddress = BigInt(address);
    const normalizedHex = '0x' + bigIntAddress.toString(16);

    return {
      isValid: true,
      format: 'decimal',
      normalizedAddress: normalizedHex,
    };
  }

  private normalizeHexAddress(hexAddress: string): string {
    // Remove 0x prefix, remove leading zeros, then add back 0x
    const hexPart = hexAddress.slice(2);
    const withoutLeadingZeros = hexPart.replace(/^0+/, '') || '0';
    return '0x' + withoutLeadingZeros;
  }

  /**
   * Utility method to check if an address is in canonical format
   * @param address - The address to check
   * @returns True if address is in canonical format
   */
  public isCanonicalFormat(address: string): boolean {
    const validation = this.validateAddress(address);
    if (!validation.isValid) {
      return false;
    }
    return address === validation.normalizedAddress;
  }

  /**
   * Get address information
   * @param address - The address to analyze
   * @returns Detailed information about the address
   */
  public getAddressInfo(address: string): {
    isValid: boolean;
    format?: 'hex' | 'decimal';
    length?: number;
    isCanonical?: boolean;
    normalizedAddress?: string;
    errors?: string[];
  } {
    const validation = this.validateAddress(address);

    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
      };
    }

    return {
      isValid: true,
      format: validation.format,
      length: address.length,
      isCanonical: this.isCanonicalFormat(address),
      normalizedAddress: validation.normalizedAddress,
    };
  }
}
