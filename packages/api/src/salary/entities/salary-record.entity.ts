import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { SalarySnapshot } from '@lol/shared';
import { User } from '../../identity/entities/user.entity';
import { Week } from '../../week/entities/week.entity';

@Entity('salary_records')
export class SalaryRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index('IDX_salary_records_dispatcher')
  dispatcherId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher!: User;

  @Column({ type: 'varchar', length: 200 })
  dispatcherName!: string;

  @Column({ type: 'uuid' })
  @Index('IDX_salary_records_week')
  weekId!: string;

  @ManyToOne(() => Week, { nullable: false })
  @JoinColumn({ name: 'weekId' })
  week!: Week;

  @Column({ type: 'varchar', length: 20 })
  weekLabel!: string;

  /** Immutable JSONB snapshot of all calculation inputs and outputs. */
  @Column({ type: 'jsonb' })
  snapshot!: SalarySnapshot;

  // ── Denormalized columns for queries ──
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  weeklyGrossProfit!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  appliedPercent!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  baseSalary!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalOther!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalBonus!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalSalary!: number;

  @Column({ type: 'int' })
  ruleVersion!: number;

  @Column({ type: 'int' })
  loadCount!: number;

  // ── Revision tracking ──
  /** Revision number — incremented on recalculate. 1 = first generation. */
  @Column({ type: 'int', default: 1 })
  revision!: number;

  /** True for the current/active record. Old revisions are marked false. */
  @Column({ type: 'boolean', default: true })
  @Index('IDX_salary_records_current')
  isCurrent!: boolean;

  // ── Audit ──
  @Column({ type: 'uuid' })
  generatedById!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'generatedById' })
  generatedBy!: User;

  @Column({ type: 'varchar', length: 200 })
  generatedByName!: string;

  @CreateDateColumn()
  generatedAt!: Date;
}
