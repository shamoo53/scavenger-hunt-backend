import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Participation } from "../entities/participation.entity"
import type { Event } from "../entities/event.entity"
import { EventStatus } from "../entities/event.entity"
import type { CreateParticipationDto } from "../dto/create-participation.dto"
import { ParticipationResponseDto } from "../dto/participation-response.dto"
import { UserEventResponseDto } from "../dto/user-events-response.dto"

@Injectable()
export class ParticipationService {
  private readonly participationRepository: Repository<Participation>
  private readonly eventRepository: Repository<Event>

  constructor(participationRepository: Repository<Participation>, eventRepository: Repository<Event>) {
    this.participationRepository = participationRepository
    this.eventRepository = eventRepository
  }

  async joinEvent(createParticipationDto: CreateParticipationDto): Promise<ParticipationResponseDto> {
    const { userId, eventId } = createParticipationDto

    // Check if event exists and is active
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException("Event not found")
    }

    // Validate event is joinable
    await this.validateEventJoinability(event)

    // Check if user has already joined this event
    const existingParticipation = await this.participationRepository.findOne({
      where: { userId, eventId },
    })

    if (existingParticipation) {
      throw new ConflictException("User has already joined this event")
    }

    // Check if event has reached maximum participants
    if (event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants) {
      throw new BadRequestException("Event has reached maximum participants")
    }

    // Create participation record
    const participation = this.participationRepository.create({
      userId,
      eventId,
    })

    const savedParticipation = await this.participationRepository.save(participation)

    // Update event participant count
    await this.eventRepository.update(eventId, {
      currentParticipants: event.currentParticipants + 1,
    })

    return new ParticipationResponseDto(savedParticipation)
  }

  async getUserJoinedEvents(userId: string): Promise<UserEventResponseDto[]> {
    const participations = await this.participationRepository
      .createQueryBuilder("participation")
      .leftJoinAndSelect("participation.event", "event", "event.id = participation.eventId")
      .where("participation.userId = :userId", { userId })
      .orderBy("participation.joinedAt", "DESC")
      .getMany()

    // Since we can't use relations in this standalone module, we'll fetch events separately
    const participationRecords = await this.participationRepository.find({
      where: { userId },
      order: { joinedAt: "DESC" },
    })

    const eventIds = participationRecords.map((p) => p.eventId)
    if (eventIds.length === 0) {
      return []
    }

    const events = await this.eventRepository.findByIds(eventIds)
    const eventMap = new Map(events.map((event) => [event.id, event]))

    return participationRecords
      .map((participation) => {
        const event = eventMap.get(participation.eventId)
        return event ? new UserEventResponseDto(participation, event) : null
      })
      .filter((item): item is UserEventResponseDto => item !== null)
  }

  async getUserParticipationForEvent(userId: string, eventId: string): Promise<ParticipationResponseDto | null> {
    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    })

    return participation ? new ParticipationResponseDto(participation) : null
  }

  async getEventParticipants(eventId: string): Promise<ParticipationResponseDto[]> {
    const participations = await this.participationRepository.find({
      where: { eventId },
      order: { joinedAt: "ASC" },
    })

    return participations.map((participation) => new ParticipationResponseDto(participation))
  }

  async getEventParticipantCount(eventId: string): Promise<number> {
    return this.participationRepository.count({
      where: { eventId },
    })
  }

  async leaveEvent(userId: string, eventId: string): Promise<void> {
    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    })

    if (!participation) {
      throw new NotFoundException("User is not participating in this event")
    }

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException("Event not found")
    }

    // Remove participation
    await this.participationRepository.remove(participation)

    // Update event participant count
    if (event.currentParticipants > 0) {
      await this.eventRepository.update(eventId, {
        currentParticipants: event.currentParticipants - 1,
      })
    }
  }

  async hasUserJoinedEvent(userId: string, eventId: string): Promise<boolean> {
    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    })

    return !!participation
  }

  private async validateEventJoinability(event: Event): Promise<void> {
    const now = new Date()

    // Check if event is active
    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException(`Event is ${event.status} and cannot be joined`)
    }

    // Check if event has started
    if (event.startDate > now) {
      throw new BadRequestException("Event has not started yet")
    }

    // Check if event has ended
    if (event.endDate < now) {
      throw new BadRequestException("Event has already ended")
    }
  }

  async getParticipationStats(): Promise<{
    totalParticipations: number
    activeEventParticipations: number
    uniqueParticipants: number
  }> {
    const totalParticipations = await this.participationRepository.count()

    const activeEvents = await this.eventRepository.find({
      where: { status: EventStatus.ACTIVE },
      select: ["id"],
    })

    const activeEventIds = activeEvents.map((event) => event.id)
    const activeEventParticipations =
      activeEventIds.length > 0
        ? await this.participationRepository.count({
            where: { eventId: activeEventIds.length === 1 ? activeEventIds[0] : undefined },
          })
        : 0

    const uniqueParticipantsResult = await this.participationRepository
      .createQueryBuilder("participation")
      .select("COUNT(DISTINCT participation.userId)", "count")
      .getRawOne()

    const uniqueParticipants = Number.parseInt(uniqueParticipantsResult?.count || "0", 10)

    return {
      totalParticipations,
      activeEventParticipations,
      uniqueParticipants,
    }
  }
}
