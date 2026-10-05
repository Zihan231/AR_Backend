import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Video } from '../database/entities/video.entity.js';
import { DownloadLog } from '../database/entities/download-log.entity.js';
import { AppConfigService } from '../config/app-config.service.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Request, Response } from 'express';

export type VideoRecord = Video;

export interface UploadResponse {
  success: boolean;
  token: string;
  viewUrl: string;
  downloadUrl: string;
  streamUrl: string;
  qrCode: string; // Base64 data URL
  qrCodeApiUrl: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(DownloadLog)
    private readonly downloadLogRepo: Repository<DownloadLog>,
    private readonly appConfig: AppConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async processAndSaveVideo(
    file: Express.Multer.File,
    clientIp?: string,
    userAgent?: string,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    const token = uuidv4();
    const now = new Date();
    const isoString = now.toISOString();
    const dateFolder = isoString.slice(0, 7); // YYYY-MM
    const dateDay = isoString.slice(0, 10); // YYYY-MM-DD

    // Determine extension
    let ext = path.extname(file.originalname).replace(/^\./, '').toLowerCase();
    if (!ext || ext === '') {
      ext = file.mimetype.includes('webm') ? 'webm' : 'mp4';
    }

    const targetDir = this.appConfig.getVideosDirectory(dateFolder);
    const targetFilename = `vid_${token}.${ext}`;
    const targetFilePath = path.join(targetDir, targetFilename);

    try {
      if (file.path) {
        fs.renameSync(file.path, targetFilePath);
      } else if (file.buffer) {
        fs.writeFileSync(targetFilePath, file.buffer);
      } else {
        throw new Error('Multer file has neither path nor buffer');
      }
    } catch (err: any) {
      this.logger.error(`Failed to write video file to disk: ${err.message}`);
      throw new BadRequestException(`Could not save video file: ${err.message}`);
    }

    const viewUrl = `${this.appConfig.baseUrl}/v/${token}`;
    const downloadUrl = `${this.appConfig.baseUrl}/api/videos/${token}/download`;
    const streamUrl = `${this.appConfig.baseUrl}/api/videos/${token}/file`;
    const qrCodeApiUrl = `${this.appConfig.baseUrl}/api/videos/${token}/qr`;

    // Generate QR Code as Base64 Data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(viewUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (qrErr: any) {
      this.logger.error(`Error generating QR code: ${qrErr.message}`);
    }

    const fileSize = file.size || (fs.existsSync(targetFilePath) ? fs.statSync(targetFilePath).size : 0);

    // Save record to database using TypeORM
    const videoEntity = this.videoRepo.create({
      token,
      filename: targetFilename,
      original_name: file.originalname || targetFilename,
      file_path: targetFilePath,
      mime_type: file.mimetype || 'video/mp4',
      size_bytes: fileSize,
      duration: 0,
      created_at: isoString,
      created_date: dateDay,
      download_count: 0,
      client_ip: clientIp || null,
      user_agent: userAgent || null,
    });

    await this.videoRepo.save(videoEntity);

    this.logger.log(`Video uploaded successfully. Token: ${token}, Size: ${fileSize} bytes`);

    return {
      success: true,
      token,
      viewUrl,
      downloadUrl,
      streamUrl,
      qrCode: qrDataUrl,
      qrCodeApiUrl,
      filename: targetFilename,
      originalName: file.originalname || targetFilename,
      sizeBytes: fileSize,
      createdAt: isoString,
    };
  }

  async getVideoByToken(token: string): Promise<Video> {
    const video = await this.videoRepo.findOne({ where: { token } });
    if (!video) {
      throw new NotFoundException('Video not found or link has expired');
    }
    video.size_bytes = Number(video.size_bytes);
    return video;
  }

  async getQrCodeBuffer(token: string): Promise<Buffer> {
    const video = await this.getVideoByToken(token);
    const viewUrl = `${this.appConfig.baseUrl}/v/${video.token}`;
    return QRCode.toBuffer(viewUrl, {
      type: 'png',
      width: 400,
      margin: 2,
    });
  }

  async recordDownload(token: string, clientIp?: string, userAgent?: string): Promise<void> {
    const now = new Date().toISOString();

    await this.dataSource.transaction(async (manager) => {
      await manager.increment(Video, { token }, 'download_count', 1);
      await manager.update(Video, { token }, { last_downloaded_at: now });

      const log = manager.create(DownloadLog, {
        video_token: token,
        downloaded_at: now,
        client_ip: clientIp || null,
        user_agent: userAgent || null,
      });

      await manager.save(DownloadLog, log);
    });
  }

  async streamVideo(token: string, req: Request, res: Response): Promise<void> {
    const video = await this.getVideoByToken(token);
    const filePath = video.file_path;

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video file not found on disk');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', video.mime_type || 'video/mp4');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }

  async downloadVideo(token: string, req: Request, res: Response): Promise<void> {
    const video = await this.getVideoByToken(token);
    const filePath = video.file_path;

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video file not found on disk');
    }

    // Record the download metric
    await this.recordDownload(token, req.ip, req.headers['user-agent'] as string);

    const stat = fs.statSync(filePath);
    const downloadName = video.original_name || video.filename || `AR_Video_${token.slice(0, 8)}.mp4`;

    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', video.mime_type || 'video/mp4');
    res.setHeader('Content-Length', stat.size);

    fs.createReadStream(filePath).pipe(res);
  }

  async deleteVideo(token: string): Promise<boolean> {
    const video = await this.getVideoByToken(token);
    if (fs.existsSync(video.file_path)) {
      try {
        fs.unlinkSync(video.file_path);
      } catch (err: any) {
        this.logger.warn(`Could not delete file ${video.file_path}: ${err.message}`);
      }
    }

    await this.videoRepo.delete({ token });
    return true;
  }
}
