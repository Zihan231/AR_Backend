import { Module } from '@nestjs/common';
import { PublicViewController } from './public-view.controller.js';
import { VideosModule } from '../videos/videos.module.js';

@Module({
  imports: [VideosModule],
  controllers: [PublicViewController],
})
export class PublicViewModule {}
