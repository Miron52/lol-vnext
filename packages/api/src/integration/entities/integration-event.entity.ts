import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IntegrationEventStatus,
  IntegrationEventResult,
} from '@lol/shared';
import { Load } from '../../load/entities/load.entity';

@Entity('integration_events')
export class IntegrationEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Source system identifier, e.g. "cargo". */
  @Column({ type: 'varchar', length: 50 })
  sourceSystem!: string;

  /** External event id for dedup. Nullable — not all sources provide one. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalEventId!: string | null;

  /** Event type hint, e.g. "load.created", "load.updated". */
  @Column({ type: 'varchar', length: 100 })
  eventType!: string;

  /** SHA-256 hex of the raw payload JSON for content-based dedup. */
  @Column({ type: 'varchar', length: 64 })
  @Index('IDX_integration_events_payload_hash')
  payloadHash!: string;

  /** Raw inbound payload, stored as-is for audit. */
  @Column({ type: 'jsonb' })
  payloadJson!: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: IntegrationEventStatus,
    default: IntegrationEventStatus.Pending,
  })
  processingStatus!: IntegrationEventStatus;

  @Column({
    type: 'enum',
    enum: IntegrationEventResult,
    nullable: true,
  })
  processingResult!: IntegrationEventResult | null;

  /** Error details when processingStatus = 'failed'. */
  @Column({ type: 'text', nullable: true })
  processingError!: string | null;

  /** FK to the Load that was created or updated. */
  @Column({ type: 'uuid', nullable: true })
  loadId!: string | null;

  @ManyToOne(() => Load, { nullable: true })
  @JoinColumn({ name: 'loadId' })
  load!: Load | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  receivedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
