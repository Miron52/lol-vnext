import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Week } from './entities/week.entity';
import {
  weekLabel,
  weekDateRange,
  isoWeekOfDate,
  WeekDto,
} from '@lol/shared';

@Injectable()
export class WeeksService {
  constructor(
    @InjectRepository(Week)
    private readonly weeksRepo: Repository<Week>,
  ) {}

  /** List weeks ordered newest-first. */
  async list(): Promise<WeekDto[]> {
    const weeks = await this.weeksRepo.find({
      order: { isoYear: 'DESC', isoWeek: 'DESC' },
    });

    const { isoYear: curYear, isoWeek: curWeek } = isoWeekOfDate(new Date());

    return weeks.map((w) => this.toDto(w, curYear, curWeek));
  }

  /** Resolve the current ISO week, creating the row if it doesn't exist. */
  async current(): Promise<WeekDto> {
    const { isoYear, isoWeek } = isoWeekOfDate(new Date());
    const week = await this.findOrCreate(isoYear, isoWeek);
    return this.toDto(week, isoYear, isoWeek);
  }

  /** Find by label, e.g. "LS2026-11". */
  async findByLabel(label: string): Promise<Week | null> {
    return this.weeksRepo.findOne({ where: { label } });
  }

  /** Find by id (uuid). */
  async findById(id: string): Promise<Week | null> {
    return this.weeksRepo.findOne({ where: { id } });
  }

  /**
   * Get or create a week row for the given ISO year/week.
   *
   * Current implementation: check-then-insert with unique constraint safety net.
   * On duplicate key conflict the insert throws — this is acceptable for the
   * current single-instance dev setup.
   *
   * TODO: Harden for production concurrency. Replace with a single
   * INSERT … ON CONFLICT ("label") DO NOTHING + follow-up SELECT, or use
   * a pg advisory lock. Track in follow-up task.
   */
  async findOrCreate(isoYear: number, isoWeek: number): Promise<Week> {
    const label = weekLabel(isoYear, isoWeek);
    const existing = await this.weeksRepo.findOne({ where: { label } });
    if (existing) return existing;

    const { startDate, endDate } = weekDateRange(isoYear, isoWeek);

    const week = this.weeksRepo.create({
      label,
      isoYear,
      isoWeek,
      startDate,
      endDate,
    });

    return this.weeksRepo.save(week);
  }

  private toDto(w: Week, curYear: number, curWeek: number): WeekDto {
    return {
      id: w.id,
      label: w.label,
      isoYear: w.isoYear,
      isoWeek: w.isoWeek,
      startDate: w.startDate,
      endDate: w.endDate,
      isCurrent: w.isoYear === curYear && w.isoWeek === curWeek,
    };
  }
}
