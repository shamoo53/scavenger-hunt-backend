import { Controller, Post, Get, Delete, HttpCode, HttpStatus } from "@nestjs/common"
import type { ParticipationService } from "../services/participation.service"
import type { CreateParticipationDto } from "../dto/create-participation.dto"
import type { ParticipationResponseDto } from "../dto/participation-response.dto"
import type { UserEventResponseDto } from "../dto/user-events-response.dto"

@Controller("event-participation")
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}

  @Post("join")
  @HttpCode(HttpStatus.CREATED)
  async joinEvent(createParticipationDto: CreateParticipationDto): Promise<ParticipationResponseDto> {
    return this.participationService.joinEvent(createParticipationDto)
  }

  @Get("user/:userId/events")
  async getUserJoinedEvents(userId: string): Promise<UserEventResponseDto[]> {
    return this.participationService.getUserJoinedEvents(userId)
  }

  @Get("user/:userId/event/:eventId")
  async getUserParticipationForEvent(userId: string, eventId: string): Promise<ParticipationResponseDto | null> {
    return this.participationService.getUserParticipationForEvent(userId, eventId)
  }

  @Get("event/:eventId/participants")
  async getEventParticipants(eventId: string): Promise<ParticipationResponseDto[]> {
    return this.participationService.getEventParticipants(eventId)
  }

  @Get("event/:eventId/count")
  async getEventParticipantCount(eventId: string): Promise<{ count: number }> {
    const count = await this.participationService.getEventParticipantCount(eventId)
    return { count }
  }

  @Delete("user/:userId/event/:eventId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveEvent(userId: string, eventId: string): Promise<void> {
    return this.participationService.leaveEvent(userId, eventId)
  }

  @Get("user/:userId/event/:eventId/status")
  async checkUserParticipation(userId: string, eventId: string): Promise<{ hasJoined: boolean }> {
    const hasJoined = await this.participationService.hasUserJoinedEvent(userId, eventId)
    return { hasJoined }
  }

  @Get("stats")
  async getParticipationStats(): Promise<{
    totalParticipations: number
    activeEventParticipations: number
    uniqueParticipants: number
  }> {
    return this.participationService.getParticipationStats()
  }
}
