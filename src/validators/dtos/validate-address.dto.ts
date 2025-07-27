import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class ValidateAddressDto {
  @IsNotEmpty()
  @IsString()
  address: string;
}

export class ValidateMultipleAddressesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  addresses: string[];
}
