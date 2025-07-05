import { IsUUID, IsString, IsOptional } from "class-validator"

export class NotificationDto {
  @IsUUID()
  puzzleId: string

  @IsString()
  puzzleTitle: string

  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsUUID()
  tagId?: string
}

export class BroadcastNotificationDto {
  @IsUUID()
  puzzleId: string

  @IsString()
  puzzleTitle: string

  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsUUID()
  tagId?: string
}
