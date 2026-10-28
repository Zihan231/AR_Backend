import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'events' })
export class BoothEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_events_event_number', { unique: true })
  @Column({ type: 'int', unique: true, name: 'event_number' })
  event_number: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 40, name: 'created_at' })
  created_at: string;
}
