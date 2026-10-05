import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../database/entities/video.entity.js';
import { AppConfigService } from '../config/app-config.service.js';

export interface SummaryMetrics {
  totalVideos: number;
  todayVideos: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  totalDownloads: number;
  todayDownloads: number;
  averageSizeBytes: number;
  averageSizeFormatted: string;
  // Filtered period metrics
  periodVideos: number;
  periodStorageBytes: number;
  periodStorageFormatted: string;
  periodDownloads: number;
  periodAverageSizeBytes: number;
  periodAverageSizeFormatted: string;
  startDate?: string;
  endDate?: string;
  isFiltered: boolean;
}

export interface DailyMetricItem {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Oct 05"
  count: number;
  storageBytes: number;
  storageMB: number;
  downloads: number;
}

export interface HourlyMetricItem {
  hour: string; // "00" to "23"
  label: string; // e.g. "12 PM"
  count: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    private readonly appConfig: AppConfigService,
  ) {}

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async getSummary(startDate?: string, endDate?: string): Promise<SummaryMetrics> {
    const today = new Date().toISOString().slice(0, 10);

    const totalRow = await this.videoRepo
      .createQueryBuilder('video')
      .select('COUNT(video.id)', 'count')
      .addSelect('COALESCE(SUM(video.size_bytes), 0)', 'total_size')
      .addSelect('COALESCE(SUM(video.download_count), 0)', 'total_dl')
      .getRawOne();

    const todayRow = await this.videoRepo
      .createQueryBuilder('video')
      .select('COUNT(video.id)', 'count')
      .addSelect('COALESCE(SUM(video.download_count), 0)', 'today_dl')
      .where('video.created_date = :today', { today })
      .getRawOne();

    const count = Number(totalRow?.count || 0);
    const totalSize = Number(totalRow?.total_size || 0);
    const totalDl = Number(totalRow?.total_dl || 0);
    const todayVideos = Number(todayRow?.count || 0);
    const todayDl = Number(todayRow?.today_dl || 0);
    const avgSize = count > 0 ? Math.round(totalSize / count) : 0;

    let periodRow = null;
    const hasFilter = Boolean(startDate || endDate);

    if (hasFilter) {
      const periodQb = this.videoRepo
        .createQueryBuilder('video')
        .select('COUNT(video.id)', 'count')
        .addSelect('COALESCE(SUM(video.size_bytes), 0)', 'total_size')
        .addSelect('COALESCE(SUM(video.download_count), 0)', 'total_dl');

      if (startDate && endDate) {
        if (startDate === endDate) {
          periodQb.where('video.created_date = :sDate', { sDate: startDate.trim() });
        } else {
          periodQb.where('video.created_date >= :sDate AND video.created_date <= :eDate', {
            sDate: startDate.trim(),
            eDate: endDate.trim(),
          });
        }
      } else if (startDate) {
        periodQb.where('video.created_date >= :sDate', { sDate: startDate.trim() });
      } else if (endDate) {
        periodQb.where('video.created_date <= :eDate', { eDate: endDate.trim() });
      }

      periodRow = await periodQb.getRawOne();
    }

    const pCount = periodRow ? Number(periodRow.count || 0) : count;
    const pSize = periodRow ? Number(periodRow.total_size || 0) : totalSize;
    const pDl = periodRow ? Number(periodRow.total_dl || 0) : totalDl;
    const pAvgSize = pCount > 0 ? Math.round(pSize / pCount) : 0;

    return {
      totalVideos: count,
      todayVideos,
      totalStorageBytes: totalSize,
      totalStorageFormatted: this.formatBytes(totalSize),
      totalDownloads: totalDl,
      todayDownloads: todayDl,
      averageSizeBytes: avgSize,
      averageSizeFormatted: this.formatBytes(avgSize),
      periodVideos: pCount,
      periodStorageBytes: pSize,
      periodStorageFormatted: this.formatBytes(pSize),
      periodDownloads: pDl,
      periodAverageSizeBytes: pAvgSize,
      periodAverageSizeFormatted: this.formatBytes(pAvgSize),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isFiltered: hasFilter,
    };
  }

  async getDailyChart(days = 14): Promise<DailyMetricItem[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (days - 1));
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const rows = await this.videoRepo
      .createQueryBuilder('video')
      .select('video.created_date', 'created_date')
      .addSelect('COUNT(video.id)', 'count')
      .addSelect('COALESCE(SUM(video.size_bytes), 0)', 'storage_bytes')
      .addSelect('COALESCE(SUM(video.download_count), 0)', 'downloads')
      .where('video.created_date >= :cutoff', { cutoff: cutoffStr })
      .groupBy('video.created_date')
      .orderBy('video.created_date', 'ASC')
      .getRawMany();

    const rowMap = new Map<string, { count: number; storage_bytes: number; downloads: number }>();
    for (const r of rows) {
      rowMap.set(String(r.created_date), {
        count: Number(r.count || 0),
        storage_bytes: Number(r.storage_bytes || 0),
        downloads: Number(r.downloads || 0),
      });
    }

    const result: DailyMetricItem[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const match = rowMap.get(dateStr);

      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const c = match ? match.count : 0;
      const bytes = match ? match.storage_bytes : 0;
      const downloads = match ? match.downloads : 0;

      result.push({
        date: dateStr,
        label,
        count: c,
        storageBytes: bytes,
        storageMB: parseFloat((bytes / (1024 * 1024)).toFixed(1)),
        downloads,
      });
    }

    return result;
  }

  async getHourlyChart(): Promise<HourlyMetricItem[]> {
    const rows = await this.videoRepo
      .createQueryBuilder('video')
      .select('SUBSTRING(video.created_at, 12, 2)', 'hour_str')
      .addSelect('COUNT(video.id)', 'count')
      .groupBy('SUBSTRING(video.created_at, 12, 2)')
      .getRawMany();

    const hourMap = new Map<string, number>();
    for (const r of rows) {
      if (r.hour_str) {
        hourMap.set(String(r.hour_str), Number(r.count || 0));
      }
    }

    const result: HourlyMetricItem[] = [];
    for (let h = 0; h < 24; h++) {
      const hStr = h.toString().padStart(2, '0');
      const count = hourMap.get(hStr) || 0;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      result.push({
        hour: hStr,
        label: `${displayHour} ${ampm}`,
        count,
      });
    }

    return result;
  }

  async getVideos(
    page = 1,
    limit = 20,
    search = '',
    date = '',
    startDate = '',
    endDate = '',
  ) {
    const qb = this.videoRepo.createQueryBuilder('video');

    if (search && search.trim() !== '') {
      qb.andWhere('(video.token LIKE :search OR video.original_name LIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }

    if (date && date.trim() !== '') {
      qb.andWhere('video.created_date = :date', { date: date.trim() });
    } else if (startDate && endDate) {
      if (startDate === endDate) {
        qb.andWhere('video.created_date = :sDate', { sDate: startDate.trim() });
      } else {
        qb.andWhere('video.created_date >= :sDate AND video.created_date <= :eDate', {
          sDate: startDate.trim(),
          eDate: endDate.trim(),
        });
      }
    } else if (startDate) {
      qb.andWhere('video.created_date >= :sDate', { sDate: startDate.trim() });
    } else if (endDate) {
      qb.andWhere('video.created_date <= :eDate', { eDate: endDate.trim() });
    }

    qb.orderBy('video.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const items = rows.map((v) => {
      const sizeBytes = Number(v.size_bytes);
      return {
        id: v.id,
        token: v.token,
        filename: v.filename,
        originalName: v.original_name,
        sizeBytes,
        sizeFormatted: this.formatBytes(sizeBytes),
        mimeType: v.mime_type,
        createdAt: v.created_at,
        createdDate: v.created_date,
        downloadCount: v.download_count,
        lastDownloadedAt: v.last_downloaded_at,
        viewUrl: `${this.appConfig.baseUrl}/v/${v.token}`,
        downloadUrl: `${this.appConfig.baseUrl}/api/videos/${v.token}/download`,
        streamUrl: `${this.appConfig.baseUrl}/api/videos/${v.token}/file`,
        qrCodeUrl: `${this.appConfig.baseUrl}/api/videos/${v.token}/qr`,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async exportCsv(startDate?: string, endDate?: string): Promise<string> {
    const qb = this.videoRepo.createQueryBuilder('video');

    if (startDate && endDate) {
      if (startDate === endDate) {
        qb.andWhere('video.created_date = :sDate', { sDate: startDate.trim() });
      } else {
        qb.andWhere('video.created_date >= :sDate AND video.created_date <= :eDate', {
          sDate: startDate.trim(),
          eDate: endDate.trim(),
        });
      }
    } else if (startDate) {
      qb.andWhere('video.created_date >= :sDate', { sDate: startDate.trim() });
    } else if (endDate) {
      qb.andWhere('video.created_date <= :eDate', { eDate: endDate.trim() });
    }

    qb.orderBy('video.created_at', 'DESC');
    const rows = await qb.getMany();

    const headers = ['Token', 'Original Name', 'File Name', 'Size (Bytes)', 'Created At', 'Date', 'Download Count', 'View URL'];
    const lines = [headers.join(',')];

    for (const r of rows) {
      const viewUrl = `${this.appConfig.baseUrl}/v/${r.token}`;
      const line = [
        `"${r.token}"`,
        `"${(r.original_name || '').replace(/"/g, '""')}"`,
        `"${r.filename}"`,
        Number(r.size_bytes),
        `"${r.created_at}"`,
        `"${r.created_date}"`,
        r.download_count,
        `"${viewUrl}"`,
      ].join(',');
      lines.push(line);
    }

    return lines.join('\n');
  }
}
