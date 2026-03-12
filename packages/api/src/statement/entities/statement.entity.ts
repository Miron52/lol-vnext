import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { StatementType, StatementSnapshot } from '@lol/shared';
import { Week } from '../../week/entities/week.entity';
import { User } from '../../identity/entities/user.entity';

@Entity('statements')
export class Statement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  statementType!: StatementType;

  // ── Week FK ────────────────────────────────────────────────
  @Column({ type: 'uuid' })
  @Index('IDX_statements_week')
  weekId!: string;

  @ManyToOne(() => Week, { nullable: false })
  @JoinColumn({ name: 'weekId' })
  week!: Week;

  @Column({ type: 'varchar', length: 20 })
  weekLabel!: string;

  // ── Optional unit filter ───────────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  unitId!: string | null;

  // ── Generator ──────────────────────────────────────────────
  @Column({ type: 'uuid' })
  generatedById!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'generatedById' })
  generatedBy!: User;

  @Column({ type: 'varchar', length: 200 })
  generatedByName!: string;

  // ── Snapshot (JSONB) ───────────────────────────────────────
  @Column({ type: 'jsonb' })
  snapshot!: StatementSnapshot;

  // ── Denormalized totals for archive list queries ───────────
  @Column({ type: 'int' })
  loadCount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalGross!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalNetProfit!: number;

  @CreateDateColumn()
  generatedAt!: Date;
}
