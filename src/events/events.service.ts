import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoothEvent } from '../database/entities/event.entity.js';
import { Video } from '../database/entities/video.entity.js';

export interface EventResponse {
  id: number;
  eventNumber: number;
  name: string;
  label: string;
  location: string;
  active: boolean;
  created_at: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(BoothEvent)
    private readonly eventRepo: Repository<BoothEvent>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
  ) {}

  private toResponse(event: BoothEvent): EventResponse {
    return {
      id: event.id,
      eventNumber: event.event_number,
      name: `Event ${event.event_number} - ${event.name}`,
      label: event.name,
      location: event.location,
      active: event.active,
      created_at: event.created_at,
    };
  }

  async getAllEvents(): Promise<EventResponse[]> {
    const events = await this.eventRepo.find({ order: { event_number: 'ASC' } });
    return events.map((event) => this.toResponse(event));
  }

  async getActiveEvents(): Promise<EventResponse[]> {
    const events = await this.eventRepo.find({
      where: { active: true },
      order: { event_number: 'ASC' },
    });
    return events.map((event) => this.toResponse(event));
  }

  async getNextEventNumber(): Promise<{ nextNumber: number }> {
    const result = await this.eventRepo
      .createQueryBuilder('event')
      .select('COALESCE(MAX(event.event_number), 0) + 1', 'next_number')
      .getRawOne<{ next_number: number | string }>();
    return { nextNumber: Number(result?.next_number || 1) };
  }

  async getEvent(id: number): Promise<EventResponse> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return this.toResponse(event);
  }

  async addEvent(rawName: string, rawLocation: string): Promise<EventResponse> {
    const name = rawName?.trim();
    const location = rawLocation?.trim();
    if (!name) {
      throw new BadRequestException('Event name cannot be empty');
    }
    if (!location) {
      throw new BadRequestException('Event location cannot be empty');
    }

    const { nextNumber } = await this.getNextEventNumber();
    const event = this.eventRepo.create({
      event_number: nextNumber,
      name,
      location,
      active: true,
      created_at: new Date().toISOString(),
    });
    return this.toResponse(await this.eventRepo.save(event));
  }

  async updateEvent(
    id: number,
    rawName: string,
    rawLocation: string,
  ): Promise<EventResponse> {
    const name = rawName?.trim();
    const location = rawLocation?.trim();
    if (!name) {
      throw new BadRequestException('Event note cannot be empty');
    }
    if (!location) {
      throw new BadRequestException('Event location cannot be empty');
    }

    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    const previousDisplayName = `Event ${event.event_number} - ${event.name}`;
    event.name = name;
    event.location = location;
    const savedEvent = await this.eventRepo.save(event);
    await this.videoRepo
      .createQueryBuilder()
      .update(Video)
      .set({ event: `Event ${savedEvent.event_number} - ${savedEvent.name}`, location })
      .where('event = :previousDisplayName', { previousDisplayName })
      .execute();
    return this.toResponse(savedEvent);
  }

  async deleteEvent(id: number): Promise<{ success: boolean }> {
    const result = await this.eventRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { success: true };
  }

  async setEventActive(id: number, active: boolean): Promise<EventResponse> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    event.active = active;
    return this.toResponse(await this.eventRepo.save(event));
  }
}
