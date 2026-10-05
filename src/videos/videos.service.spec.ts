import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosService } from './videos.service.js';
import { AppConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { Video } from '../database/entities/video.entity.js';
import { DownloadLog } from '../database/entities/download-log.entity.js';
import * as fs from 'node:fs';

describe('VideosService', () => {
  let service: VideosService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([Video, DownloadLog]),
      ],
      providers: [VideosService],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process, save video, and generate QR code', async () => {
    const fakeBuffer = Buffer.from('mock video data 123');
    const mockFile: any = {
      fieldname: 'video',
      originalname: 'test_ar_clip.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      buffer: fakeBuffer,
      size: fakeBuffer.length,
    };

    const result = await service.processAndSaveVideo(mockFile, '127.0.0.1', 'Vitest');

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(10);
    expect(result.qrCode).toContain('data:image/png;base64,');
    expect(result.viewUrl).toContain(`/v/${result.token}`);
    expect(result.downloadUrl).toContain(`/api/videos/${result.token}/download`);

    // Verify video metadata can be retrieved
    const fetched = await service.getVideoByToken(result.token);
    expect(fetched.token).toBe(result.token);
    expect(fetched.original_name).toBe('test_ar_clip.mp4');
    expect(Number(fetched.download_count)).toBe(0);

    // Verify file exists on disk
    expect(fs.existsSync(fetched.file_path)).toBe(true);

    // Clean up
    await service.deleteVideo(result.token);
    expect(fs.existsSync(fetched.file_path)).toBe(false);
  });

  it('should increment download count on download', async () => {
    const fakeBuffer = Buffer.from('download test video');
    const mockFile: any = {
      fieldname: 'video',
      originalname: 'dl_test.mp4',
      mimetype: 'video/mp4',
      buffer: fakeBuffer,
      size: fakeBuffer.length,
    };

    const saved = await service.processAndSaveVideo(mockFile);
    await service.recordDownload(saved.token, '192.168.1.100', 'MobileSafari');

    const video = await service.getVideoByToken(saved.token);
    expect(Number(video.download_count)).toBe(1);
    expect(video.last_downloaded_at).not.toBeNull();

    // Clean up
    await service.deleteVideo(saved.token);
  });
});
