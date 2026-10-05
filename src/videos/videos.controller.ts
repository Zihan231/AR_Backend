import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { VideosService } from './videos.service.js';
import { AppConfigService } from '../config/app-config.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { Request, Response } from 'express';

// Setup temporary upload storage inside application storage directory to prevent cross-device (EXDEV) errors
const storageBase = process.env.STORAGE_DIR
  ? path.resolve(process.cwd(), process.env.STORAGE_DIR)
  : path.resolve(process.cwd(), 'uploads');
const tempUploadDir = path.join(storageBase, 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

@Controller('api/videos')
export class VideosController {
  private readonly logger = new Logger(VideosController.name);

  constructor(
    private readonly videosService: VideosService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, tempUploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname) || '.mp4';
          cb(null, `upload-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 250 * 1024 * 1024, // 250MB limit
      },
      fileFilter: (req, file, cb) => {
        // Accept common video formats
        if (
          file.mimetype.startsWith('video/') ||
          file.mimetype === 'application/octet-stream' ||
          file.originalname.match(/\.(mp4|webm|mov|m4v)$/i)
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a valid video file under the "video" field');
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.videosService.processAndSaveVideo(file, clientIp, userAgent);
  }

  @Get(':token')
  async getVideoMetadata(@Param('token') token: string) {
    const video = await this.videosService.getVideoByToken(token);
    return {
      token: video.token,
      filename: video.filename,
      originalName: video.original_name,
      sizeBytes: video.size_bytes,
      mimeType: video.mime_type,
      createdAt: video.created_at,
      downloadCount: video.download_count,
      viewUrl: `${this.appConfig.baseUrl}/v/${video.token}`,
      downloadUrl: `${this.appConfig.baseUrl}/api/videos/${video.token}/download`,
      streamUrl: `${this.appConfig.baseUrl}/api/videos/${video.token}/file`,
      qrCodeUrl: `${this.appConfig.baseUrl}/api/videos/${video.token}/qr`,
    };
  }

  @Get(':token/file')
  async streamVideo(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.videosService.streamVideo(token, req, res);
  }

  @Get(':token/download')
  async downloadVideo(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.videosService.downloadVideo(token, req, res);
  }

  @Get(':token/qr')
  async getQrCode(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const buffer = await this.videosService.getQrCodeBuffer(token);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  @UseGuards(AuthGuard)
  @Delete(':token')
  async deleteVideo(@Param('token') token: string) {
    await this.videosService.deleteVideo(token);
    return { success: true, message: 'Video deleted successfully' };
  }
}
