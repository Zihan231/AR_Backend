import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity({ name: 'videos' })
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_videos_token', { unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  original_name: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  file_path: string;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mime_type: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  size_bytes: number;

  @Column({ type: 'double', default: 0 })
  duration: number;

  @Index('idx_videos_created_at')
  @Column({ type: 'varchar', length: 40, name: 'created_at' })
  created_at: string;

  @Index('idx_videos_created_date')
  @Column({ type: 'varchar', length: 20, name: 'created_date' })
  created_date: string;

  @Column({ type: 'int', default: 0, name: 'download_count' })
  download_count: number;

  @Column({ type: 'varchar', length: 40, nullable: true, name: 'last_downloaded_at' })
  last_downloaded_at: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'client_ip' })
  client_ip: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;
}
