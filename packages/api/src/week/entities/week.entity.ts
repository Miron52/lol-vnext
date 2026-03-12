import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('weeks')
@Unique('UQ_weeks_year_week', ['isoYear', 'isoWeek'])
export class Week {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Canonical label, e.g. "LS2026-11". Unique, indexed. */
  @Column({ type: 'varchar', length: 20, unique: true })
  label!: string;

  @Column({ type: 'int' })
  isoYear!: number;

  @Column({ type: 'int' })
  isoWeek!: number;

  /** Monday of this ISO week (YYYY-MM-DD). */
  @Column({ type: 'date' })
  startDate!: string;

  /** Sunday of this ISO week (YYYY-MM-DD). */
  @Column({ type: 'date' })
  endDate!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
