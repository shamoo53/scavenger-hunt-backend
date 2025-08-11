// src/departments/dto/create-department.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  headOfDepartment?: string;
}
