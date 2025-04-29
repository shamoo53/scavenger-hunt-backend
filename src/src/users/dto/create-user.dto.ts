import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  Matches,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';

export class CreateUsersDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  lastName: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&])[a-zA-Z0-9!@#$%^&]{8,16}$/,
    {
      message:
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character, and be 8-16 characters long.',
    },
  )
  password: string;
}
