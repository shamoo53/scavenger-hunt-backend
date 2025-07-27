// src/validators/validators.service.spec.ts (Test file)
import { Test, TestingModule } from '@nestjs/testing';
import { StarkNetAddressValidator } from './starknet-address.validator';

describe('StarkNetAddressValidator', () => {
  let validator: StarkNetAddressValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StarkNetAddressValidator],
    }).compile();

    validator = module.get<StarkNetAddressValidator>(StarkNetAddressValidator);
  });

  describe('validateAddress', () => {
    it('should validate correct hex addresses', () => {
      const validHexAddresses = [
        '0x1',
        '0x123',
        '0x1234567890abcdef',
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      ];

      validHexAddresses.forEach((address) => {
        const result = validator.validateAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.format).toBe('hex');
        expect(result.normalizedAddress).toBeDefined();
      });
    });

    it('should validate correct decimal addresses', () => {
      const validDecimalAddresses = [
        '1',
        '123456789',
        '2087021424722619777119509474943472645767659996348769578120564519014510906823',
      ];

      validDecimalAddresses.forEach((address) => {
        const result = validator.validateAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.format).toBe('decimal');
        expect(result.normalizedAddress).toBeDefined();
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '',
        '0x',
        '0xzz',
        '0x' + 'a'.repeat(65), // Too long
        '0',
        'invalid',
        '0x0000000000000000000000000000000000000000000000000000000000000000', // All zeros
      ];

      invalidAddresses.forEach((address) => {
        const result = validator.validateAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });
    });

    it('should normalize addresses correctly', () => {
      const testCases = [
        { input: '0x001', expected: '0x1' },
        { input: '0x0000123', expected: '0x123' },
        { input: '123', expected: '0x7b' }, // 123 in decimal = 7b in hex
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validator.validateAddress(input);
        expect(result.isValid).toBe(true);
        expect(result.normalizedAddress).toBe(expected);
      });
    });
  });

  describe('validateMultipleAddresses', () => {
    it('should validate multiple addresses', () => {
      const addresses = ['0x1', '0x123', 'invalid', '456'];
      const results = validator.validateMultipleAddresses(addresses);

      expect(results).toHaveLength(4);
      expect(results[0].isValid).toBe(true); // 0x1
      expect(results[1].isValid).toBe(true); // 0x123
      expect(results[2].isValid).toBe(false); // invalid
      expect(results[3].isValid).toBe(true); // 456
    });
  });

  describe('normalizeAddress', () => {
    it('should return normalized address for valid inputs', () => {
      expect(validator.normalizeAddress('0x001')).toBe('0x1');
      expect(validator.normalizeAddress('123')).toBe('0x7b');
    });

    it('should return null for invalid inputs', () => {
      expect(validator.normalizeAddress('invalid')).toBeNull();
      expect(validator.normalizeAddress('')).toBeNull();
    });
  });

  describe('areAllAddressesValid', () => {
    it('should return true when all addresses are valid', () => {
      const validAddresses = ['0x1', '0x123', '456'];
      expect(validator.areAllAddressesValid(validAddresses)).toBe(true);
    });

    it('should return false when any address is invalid', () => {
      const mixedAddresses = ['0x1', 'invalid', '456'];
      expect(validator.areAllAddressesValid(mixedAddresses)).toBe(false);
    });
  });
});
