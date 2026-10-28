import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '../database/entities/video.entity.js';
import { DownloadLog } from '../database/entities/download-log.entity.js';
import { VideosController } from './videos.controller.js';
import { VideosService } from './videos.service.js';
import { BoothEvent } from '../database/entities/event.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Video, DownloadLog, BoothEvent])],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
