import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import mysql from 'mysql2/promise';
import { AppConfigModule } from '../config/config.module.js';
import { AppConfigService } from '../config/app-config.service.js';
import { Video } from './entities/video.entity.js';
import { DownloadLog } from './entities/download-log.entity.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => {
        // Ensure the database exists in MySQL before TypeORM pool initializes
        try {
          const bootstrapConn = await mysql.createConnection({
            host: config.dbHost,
            port: config.dbPort,
            user: config.dbUser,
            password: config.dbPassword,
          });
          await bootstrapConn.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
          );
          await bootstrapConn.end();
        } catch (err: any) {
          console.warn(`Could not verify/create database '${config.dbName}': ${err.message}`);
        }

        return {
          type: 'mysql',
          host: config.dbHost,
          port: config.dbPort,
          username: config.dbUser,
          password: config.dbPassword,
          database: config.dbName,
          entities: [Video, DownloadLog],
          synchronize: true, // Automatically synchronize entities with schema in dev
          logging: false,
          extra: {
            connectionLimit: 10,
            dateStrings: true,
            supportBigNumbers: true,
            bigNumberStrings: false,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([Video, DownloadLog]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
