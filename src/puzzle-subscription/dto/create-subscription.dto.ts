import { IsUUID, IsOptional, ValidateIf } from "class-validator"

export class CreateSubscriptionDto {
  @IsUUID()
  userId: string

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.tagId)
  categoryId?: string

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.categoryId)
  tagId?: string
}
