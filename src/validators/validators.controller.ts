// src/validators/validators.controller.ts
import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import {
  StarkNetAddressValidator,
  StarkNetAddressValidationResult,
} from './starknet-address.validator';
import {
  ValidateAddressDto,
  ValidateMultipleAddressesDto,
} from './dtos/validate-address.dto';
import { Public } from 'src/auth/decorators/auth.decorators';

@Controller('validators')
export class ValidatorsController {
  constructor(private readonly starkNetValidator: StarkNetAddressValidator) {}

  @Public()
  @Post('starknet/validate')
  validateAddress(
    @Body() validateAddressDto: ValidateAddressDto,
  ): StarkNetAddressValidationResult {
    return this.starkNetValidator.validateAddress(validateAddressDto.address);
  }

  @Public()
  @Post('starknet/validate-multiple')
  validateMultipleAddresses(
    @Body() validateMultipleDto: ValidateMultipleAddressesDto,
  ): {
    results: StarkNetAddressValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
    };
  } {
    const results = this.starkNetValidator.validateMultipleAddresses(
      validateMultipleDto.addresses,
    );
    const validCount = results.filter((r) => r.isValid).length;

    return {
      results,
      summary: {
        total: results.length,
        valid: validCount,
        invalid: results.length - validCount,
      },
    };
  }

  @Public()
  @Get('starknet/normalize/:address')
  normalizeAddress(@Param('address') address: string): {
    originalAddress: string;
    normalizedAddress: string | null;
    isValid: boolean;
  } {
    const normalizedAddress = this.starkNetValidator.normalizeAddress(address);

    return {
      originalAddress: address,
      normalizedAddress,
      isValid: normalizedAddress !== null,
    };
  }

  @Public()
  @Get('starknet/info/:address')
  getAddressInfo(@Param('address') address: string) {
    return this.starkNetValidator.getAddressInfo(address);
  }
}
