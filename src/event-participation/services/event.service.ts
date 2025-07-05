import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Event } from "../entities/event.entity"
import { EventStatus } from "../entities/event.entity"
import type { CreateEventDto } from "../dto/create-event.dto"
import { EventResponseDto } from "../dto/event-response.dto"

@Injectable()
export class EventService {
  private readonly eventRepository: Repository<Event>

  constructor(eventRepository: Repository<Event>) {
    this.eventRepository = eventRepository
  }

  async createEvent(createEventDto: CreateEventDto): Promise<EventResponseDto> {
    const { title, description, status, startDate, endDate, maxParticipants, metadata } = createEventDto

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      throw new BadRequestException("Start date must be before end date")
    }

    const event = this.eventRepository.create({
      title,
      description: description || null,
      status: status || EventStatus.UPCOMING,
      startDate: start,
      endDate: end,
      maxParticipants: maxParticipants || 0,
      currentParticipants: 0,
      metadata: metadata || null,
    })

    const savedEvent = await this.eventRepository.save(event)
    return new EventResponseDto(savedEvent)
  }

  async getEventById(eventId: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException("Event not found")
    }

    return new EventResponseDto(event)
  }

  async getAllEvents(): Promise<EventResponseDto[]> {
    const events = await this.eventRepository.find({
      order: { createdAt: "DESC" },
    })

    return events.map((event) => new EventResponseDto(event))
  }

  async getActiveEvents(): Promise<EventResponseDto[]> {
    const now = new Date()
    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.status = :status", { status: EventStatus.ACTIVE })
      .andWhere("event.startDate <= :now", { now })
      .andWhere("event.endDate > :now", { now })
      .orderBy("event.startDate", "ASC")
      .getMany()

    return events.map((event) => new EventResponseDto(event))
  }

  async getEventsByStatus(status: EventStatus): Promise<EventResponseDto[]> {
    const events = await this.eventRepository.find({
      where: { status },
      order: { createdAt: "DESC" },
    })

    return events.map((event) => new EventResponseDto(event))
  }

  async updateEventStatus(eventId: string, status: EventStatus): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException("Event not found")
    }

    event.status = status
    const updatedEvent = await this.eventRepository.save(event)

    return new EventResponseDto(updatedEvent)
  }

  async deleteEvent(eventId: string): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException("Event not found")
    }

    await this.eventRepository.remove(event)
  }

  async updateEventParticipantCount(eventId: string): Promise<void> {
    // This would typically be called by the participation service
    // but we'll implement it here for completeness
    const result = await this.eventRepository
      .createQueryBuilder()
      .update(Event)
      .set({
        currentParticipants: () => `(
          SELECT COUNT(*) 
          FROM event_participations 
          WHERE event_participations.eventId = :eventId
        )`,
      })
      .where("id = :eventId", { eventId })
      .execute()

    if (result.affected === 0) {
      throw new NotFoundException("Event not found")
    }
  }
}
