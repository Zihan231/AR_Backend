import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import 'dotenv/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  readonly port: number = parseInt(process.env.PORT || '3000', 10);
  readonly host: string = process.env.HOST || '0.0.0.0';
  readonly maxFileSizeMB: number = parseInt(process.env.MAX_FILE_SIZE_MB || '250', 10);
  readonly storageDir: string;
  readonly baseUrl: string;

  // Database configuration (supports local MySQL/XAMPP and TiDB Cloud Serverless)
  readonly dbHost: string = process.env.DB_HOST || '127.0.0.1';
  readonly dbPort: number = parseInt(process.env.DB_PORT || '3306', 10);
  readonly dbUser: string = process.env.DB_USER || 'root';
  readonly dbPassword: string = process.env.DB_PASSWORD || '';
  readonly dbName: string;
  readonly dbSsl: any;

  // Dashboard Authentication
  readonly adminUsername: string = process.env.ADMIN_USERNAME || 'admin';
  readonly adminPassword: string = process.env.ADMIN_PASSWORD || 'admin123';
  readonly jwtSecret: string = process.env.JWT_SECRET || 'ar_booth_super_secret_jwt_key_2026';

  constructor() {
    this.storageDir = path.resolve(process.cwd(), process.env.STORAGE_DIR || './uploads');
    this.baseUrl = this.resolveBaseUrl();

    // TiDB / MySQL: 'sys' is a reserved system metadata schema where table creation is denied.
    // Default to 'ar_booth' if unspecified or if 'sys' is configured.
    const rawDbName = (process.env.DB_NAME || '').trim();
    if (!rawDbName || rawDbName.toLowerCase() === 'sys') {
      this.dbName = 'ar_booth';
      if (rawDbName.toLowerCase() === 'sys') {
        this.logger.warn(
          `Database name is set to '${rawDbName}' which is a reserved system schema in MySQL/TiDB. Using 'ar_booth' for application data.`,
        );
      }
    } else {
      this.dbName = rawDbName;
    }

    // SSL configuration for TiDB Cloud / Remote TLS
    const isCloudHost = this.dbHost.includes('tidbcloud.com');
    const sslExplicitFalse = process.env.DB_SSL?.toLowerCase() === 'false';
    const useSsl = !sslExplicitFalse && (process.env.DB_SSL === 'true' || isCloudHost);
    const caPath = process.env.DB_CA_PATH?.trim();

    if (useSsl) {
      const sslOpts: any = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      };
      if (caPath && fs.existsSync(caPath)) {
        try {
          sslOpts.ca = fs.readFileSync(caPath, 'utf8');
        } catch (e: any) {
          this.logger.warn(`Could not read DB_CA_PATH file (${caPath}): ${e.message}`);
        }
      }
      this.dbSsl = sslOpts;
    } else {
      this.dbSsl = false;
    }

    // Ensure storage directories exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    const videosDir = path.join(this.storageDir, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    this.logger.log(`App Base URL configured as: ${this.baseUrl}`);
    this.logger.log(`Storage directory: ${this.storageDir}`);
    this.logger.log(`Database target: ${this.dbUser}@${this.dbHost}:${this.dbPort}/${this.dbName} (SSL: ${useSsl ? 'enabled' : 'disabled'})`);
  }

  private resolveBaseUrl(): string {
    // If running on Render, automatically use Render's public HTTPS URL
    if (process.env.RENDER_EXTERNAL_URL) {
      return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    }

    if (process.env.BASE_URL) {
      return process.env.BASE_URL.replace(/\/+$/, '');
    }

    // Attempt to detect local network IPv4 address for QR mobile scanning
    const localIp = this.detectLocalIp();
    if (localIp) {
      return `http://${localIp}:${this.port}`;
    }

    return `http://localhost:${this.port}`;
  }

  detectLocalIp(): string | null {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        // Skip internal/loopback and non-IPv4
        if (iface.family === 'IPv4' && !iface.internal) {
          // Skip APIPA (169.254.x.x) if possible
          if (!iface.address.startsWith('169.254.')) {
            return iface.address;
          }
        }
      }
    }
    return null;
  }

  getVideosDirectory(yearMonth?: string): string {
    const dir = yearMonth 
      ? path.join(this.storageDir, 'videos', yearMonth) 
      : path.join(this.storageDir, 'videos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
}
