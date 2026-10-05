import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service.js';
import { VideosService } from '../videos/videos.service.js';
import { AppConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { Video } from '../database/entities/video.entity.js';
import { DownloadLog } from '../database/entities/download-log.entity.js';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let videosService: VideosService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([Video, DownloadLog]),
      ],
      providers: [VideosService, AnalyticsService],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    videosService = module.get<VideosService>(VideosService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(analyticsService).toBeDefined();
  });

  it('should aggregate summary metrics, daily charts, and CSV export', async () => {
    const mockFile: any = {
      fieldname: 'video',
      originalname: 'analytics_test.mp4',
      mimetype: 'video/mp4',
      buffer: Buffer.from('mock video bytes for analytics testing'),
      size: 40,
    };

    const saved = await videosService.processAndSaveVideo(mockFile);

    const summary = await analyticsService.getSummary();
    expect(summary.totalVideos).toBeGreaterThanOrEqual(1);
    expect(summary.todayVideos).toBeGreaterThanOrEqual(1);
    expect(summary.totalStorageBytes).toBeGreaterThanOrEqual(40);

    const dailyChart = await analyticsService.getDailyChart(7);
    expect(dailyChart).toHaveLength(7);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayItem = dailyChart.find((d) => d.date === todayStr);
    expect(todayItem).toBeDefined();
    expect(todayItem?.count).toBeGreaterThanOrEqual(1);

    const hourlyChart = await analyticsService.getHourlyChart();
    expect(hourlyChart).toHaveLength(24);

    const videoList = await analyticsService.getVideos(1, 10, 'analytics_test');
    expect(videoList.items.length).toBeGreaterThanOrEqual(1);
    expect(videoList.items[0].originalName).toBe('analytics_test.mp4');

    const csv = await analyticsService.exportCsv();
    expect(csv).toContain('Token,Original Name');
    expect(csv).toContain(saved.token);

    // Clean up
    await videosService.deleteVideo(saved.token);
  });
});
