import { Module } from '@nestjs/common';
import { StarkNetAddressValidator } from './starknet-address.validator';
import { ValidatorsController } from './validators.controller';

@Module({
  providers: [StarkNetAddressValidator],
  controllers: [ValidatorsController],
  exports: [StarkNetAddressValidator],
})
export class ValidatorsModule {}
