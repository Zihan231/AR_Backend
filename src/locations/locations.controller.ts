import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async getLocations() {
    return this.locationsService.getAllLocations();
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Post()
  async addLocation(@Body('name') name: string) {
    return this.locationsService.addLocation(name);
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteLocation(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.deleteLocation(id);
  }
}
