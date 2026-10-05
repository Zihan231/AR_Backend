import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { Response } from 'express';

@UseGuards(AuthGuard)
@Controller('api')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics/summary')
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSummary(startDate, endDate);
  }

  @Get('analytics/daily-chart')
  async getDailyChart(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 14;
    return this.analyticsService.getDailyChart(Math.min(Math.max(numDays, 1), 90));
  }

  @Get('analytics/hourly-chart')
  async getHourlyChart() {
    return this.analyticsService.getHourlyChart();
  }

  @Get('videos')
  async getVideos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? Math.max(parseInt(page, 10), 1) : 1;
    const limitNum = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 100) : 20;
    return this.analyticsService.getVideos(pageNum, limitNum, search, date, startDate, endDate);
  }

  @Get('analytics/export-csv')
  async exportCsv(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csv = await this.analyticsService.exportCsv(startDate, endDate);
    const filename = `ar_booth_metrics_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
