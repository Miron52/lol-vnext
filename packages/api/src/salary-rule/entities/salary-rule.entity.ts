import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { SalaryRuleTier, SalaryApplicationMode, SalaryBase } from '@lol/shared';
import { User } from '../../identity/entities/user.entity';

@Entity('salary_rules')
export class SalaryRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Human-readable rule set name. */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /** Monotonically increasing version, auto-incremented on every save. */
  @Column({ type: 'int', default: 1 })
  version!: number;

  /** Only one rule set may be active at a time. */
  @Column({ type: 'boolean', default: false })
  @Index('IDX_salary_rules_active')
  isActive!: boolean;

  /** Date from which this rule version takes effect. */
  @Column({ type: 'date' })
  effectiveFrom!: string;

  /** How salary is applied. Currently only 'flat_rate'. */
  @Column({ type: 'varchar', length: 20, default: 'flat_rate' })
  applicationMode!: SalaryApplicationMode;

  /** What the salary is based on. Currently only 'gross_profit'. */
  @Column({ type: 'varchar', length: 20, default: 'gross_profit' })
  salaryBase!: SalaryBase;

  /** Array of tier rows: { tierOrder, minProfit, maxProfit, percent }. */
  @Column({ type: 'jsonb' })
  tiers!: SalaryRuleTier[];

  /** Who created/modified this version. */
  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  /** Denormalized name for display. */
  @Column({ type: 'varchar', length: 200 })
  createdByName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
