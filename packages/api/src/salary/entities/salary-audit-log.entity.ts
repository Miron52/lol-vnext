import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { SalaryAuditAction } from '@lol/shared';
import { Week } from '../../week/entities/week.entity';
import { User } from '../../identity/entities/user.entity';

@Entity('salary_audit_logs')
export class SalaryAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index('IDX_salary_audit_logs_week')
  weekId!: string;

  @ManyToOne(() => Week, { nullable: false })
  @JoinColumn({ name: 'weekId' })
  week!: Week;

  @Column({ type: 'varchar', length: 30 })
  action!: SalaryAuditAction;

  @Column({ type: 'uuid' })
  performedById!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'performedById' })
  performedBy!: User;

  @Column({ type: 'varchar', length: 200 })
  performedByName!: string;

  /** Human-readable detail, e.g. "Generated salary for 4 dispatchers" */
  @Column({ type: 'text' })
  detail!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
