import { Controller, Post, Get, Put, Delete, Param, HttpCode, HttpStatus } from "@nestjs/common"
import type { EventService } from "../services/event.service"
import type { CreateEventDto } from "../dto/create-event.dto"
import type { EventResponseDto } from "../dto/event-response.dto"
import type { EventStatus } from "../entities/event.entity"

@Controller("events")
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(createEventDto: CreateEventDto): Promise<EventResponseDto> {
    return this.eventService.createEvent(createEventDto)
  }

  @Get()
  async getAllEvents(): Promise<EventResponseDto[]> {
    return this.eventService.getAllEvents()
  }

  @Get("active")
  async getActiveEvents(): Promise<EventResponseDto[]> {
    return this.eventService.getActiveEvents()
  }

  @Get("status/:status")
  async getEventsByStatus(@Param('status') status: string): Promise<EventResponseDto[]> {
    return this.eventService.getEventsByStatus(status as EventStatus)
  }

  @Get(":id")
  async getEventById(@Param('id') eventId: string): Promise<EventResponseDto> {
    return this.eventService.getEventById(eventId)
  }

  @Put(":id/status/:status")
  async updateEventStatus(@Param('id') eventId: string, @Param('status') status: string): Promise<EventResponseDto> {
    return this.eventService.updateEventStatus(eventId, status as EventStatus)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('id') eventId: string): Promise<void> {
    return this.eventService.deleteEvent(eventId)
  }
}
