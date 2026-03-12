import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { SalaryWeekStatus } from '@lol/shared';
import { Week } from '../../week/entities/week.entity';
import { User } from '../../identity/entities/user.entity';

@Entity('salary_week_states')
export class SalaryWeekState {
  /** weekId is both PK and FK — one row per week. */
  @PrimaryColumn({ type: 'uuid' })
  weekId!: string;

  @ManyToOne(() => Week, { nullable: false })
  @JoinColumn({ name: 'weekId' })
  week!: Week;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: SalaryWeekStatus;

  @Column({ type: 'timestamptz', nullable: true })
  generatedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  generatedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'generatedById' })
  generatedBy!: User | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  generatedByName!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  frozenAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  frozenById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'frozenById' })
  frozenBy!: User | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  frozenByName!: string | null;
}
