import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../database/entities/location.entity.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async getAllLocations(): Promise<Location[]> {
    return this.locationRepo.find({
      order: { name: 'ASC' },
    });
  }

  async addLocation(rawName: string): Promise<Location> {
    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestException('Location name cannot be empty');
    }

    const existing = await this.locationRepo.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Location "${name}" already exists`);
    }

    const loc = this.locationRepo.create({
      name,
      created_at: new Date().toISOString(),
    });

    return this.locationRepo.save(loc);
  }

  async deleteLocation(id: number): Promise<{ success: boolean }> {
    const res = await this.locationRepo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }
    return { success: true };
  }
}
