import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Participation } from "./entities/participation.entity"
import { Event } from "./entities/event.entity"
import { ParticipationService } from "./services/participation.service"
import { EventService } from "./services/event.service"
import { ParticipationController } from "./controllers/participation.controller"
import { EventController } from "./controllers/event.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Participation, Event])],
  controllers: [ParticipationController, EventController],
  providers: [ParticipationService, EventService],
  exports: [ParticipationService, EventService],
})
export class EventParticipationModule {}
