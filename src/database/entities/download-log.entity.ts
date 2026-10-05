import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity({ name: 'download_logs' })
export class DownloadLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_download_logs_token')
  @Column({ type: 'varchar', length: 64, name: 'video_token' })
  video_token: string;

  @Index('idx_download_logs_at')
  @Column({ type: 'varchar', length: 40, name: 'downloaded_at' })
  downloaded_at: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'client_ip' })
  client_ip: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;
}
