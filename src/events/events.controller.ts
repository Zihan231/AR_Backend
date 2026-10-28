import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { EventsService } from './events.service.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents() {
    return this.eventsService.getActiveEvents();
  }

  @UseGuards(AuthGuard)
  @Get('manage')
  async getManagedEvents() {
    return this.eventsService.getAllEvents();
  }

  @UseGuards(AuthGuard)
  @Get('next-number')
  async getNextEventNumber() {
    return this.eventsService.getNextEventNumber();
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Post()
  async addEvent(
    @Body('name') name: string,
    @Body('location') location: string,
  ) {
    return this.eventsService.addEvent(name, location);
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Patch(':id')
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Body('location') location: string,
  ) {
    return this.eventsService.updateEvent(id, name, location);
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Patch(':id/status')
  async setEventActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('active') active: boolean,
  ) {
    return this.eventsService.setEventActive(id, active === true);
  }

  @UseGuards(AuthGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteEvent(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.deleteEvent(id);
  }
}
