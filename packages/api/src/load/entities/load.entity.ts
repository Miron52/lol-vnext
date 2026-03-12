import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LoadStatus } from '@lol/shared';
import { Week } from '../../week/entities/week.entity';
import { User } from '../../identity/entities/user.entity';

@Entity('loads')
export class Load {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business identifier, e.g. "TLS26-11-45". Unique. */
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('IDX_loads_syl_number', { unique: true })
  sylNumber!: string;

  // ── External dedup pair ────────────────────────────────────────
  /** Origin system: "cargo_etl" | "manual" | etc. Nullable for manual entry. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  externalSource!: string | null;

  /** Key in the external system. Together with externalSource forms dedup pair. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalLoadKey!: string | null;

  // ── Week FK (ready) ────────────────────────────────────────────
  @Column({ type: 'uuid' })
  weekId!: string;

  @ManyToOne(() => Week, { nullable: false })
  @JoinColumn({ name: 'weekId' })
  week!: Week;

  @Column({ type: 'date' })
  date!: string;

  // ── Staged FKs — nullable until Unit/Driver/Brokerage entities exist ──
  /** Unit id. FK deferred until Unit entity is created. */
  @Column({ type: 'uuid', nullable: true })
  unitId!: string | null;

  /** Driver id. FK deferred until Driver entity is created. */
  @Column({ type: 'uuid', nullable: true })
  driverId!: string | null;

  // ── Dispatcher FK (ready — references users table) ─────────────
  @Column({ type: 'uuid' })
  dispatcherId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher!: User;

  @Column({ type: 'varchar', length: 255 })
  businessName!: string;

  /** Brokerage id. FK deferred until Brokerage entity is created. */
  @Column({ type: 'uuid', nullable: true })
  brokerageId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  netsuiteRef!: string | null;

  // ── Route ──────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 500 })
  fromAddress!: string;

  @Column({ type: 'varchar', length: 10 })
  fromState!: string;

  @Column({ type: 'date' })
  fromDate!: string;

  @Column({ type: 'varchar', length: 500 })
  toAddress!: string;

  @Column({ type: 'varchar', length: 10 })
  toState!: string;

  @Column({ type: 'date' })
  toDate!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  miles!: number;

  // ── Financials ─────────────────────────────────────────────────
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  grossAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  driverCostAmount!: number;

  /** Derived: grossAmount - driverCostAmount. Stored for query performance. */
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  profitAmount!: number;

  /** Derived: (profitAmount / grossAmount) × 100. Stored for query performance. */
  @Column({ type: 'numeric', precision: 6, scale: 2 })
  profitPercent!: number;

  /** Derived: grossAmount × 0.0125 (OTR fee). Stored for query performance. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  otrAmount!: number;

  /** Derived: profitAmount − otrAmount. Stored for query performance. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  netProfitAmount!: number;

  // ── Flags ──────────────────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  quickPayFlag!: boolean;

  @Column({ type: 'boolean', default: false })
  directPaymentFlag!: boolean;

  @Column({ type: 'boolean', default: false })
  factoringFlag!: boolean;

  @Column({ type: 'boolean', default: false })
  driverPaidFlag!: boolean;

  // ── Status & meta ──────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: LoadStatus,
    default: LoadStatus.NotPickedUp,
  })
  loadStatus!: LoadStatus;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  /** Audit trail: how this load was created/last modified. "manual" | "webhook". */
  @Column({ type: 'varchar', length: 20, default: 'manual' })
  auditSource!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;
}
