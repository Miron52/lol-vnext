import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import type { DashboardDto, WeeklyAggregation } from '@lol/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
    @InjectRepository(Week)
    private readonly weeksRepo: Repository<Week>,
  ) {}

  /**
   * Aggregate load financials grouped by week for a date range.
   * Weeks are identified by weekId (UUID) references on each load.
   * Returns totals + per-week breakdown ordered oldest → newest.
   */
  async aggregate(weekIds: string[]): Promise<DashboardDto> {
    if (!weekIds.length) {
      throw new BadRequestException('At least one weekId is required');
    }

    // Fetch the week metadata for labels/dates
    const weeks = await this.weeksRepo
      .createQueryBuilder('week')
      .where('week.id IN (:...weekIds)', { weekIds })
      .orderBy('week.isoYear', 'ASC')
      .addOrderBy('week.isoWeek', 'ASC')
      .getMany();

    // Aggregate loads per week using SQL SUM/COUNT
    const rawRows: {
      weekId: string;
      loadCount: string;
      grossAmount: string;
      driverCostAmount: string;
      profitAmount: string;
      otrAmount: string;
      netProfitAmount: string;
    }[] = await this.loadsRepo
      .createQueryBuilder('load')
      .select('load.weekId', 'weekId')
      .addSelect('COUNT(*)::int', 'loadCount')
      .addSelect('COALESCE(SUM(load.grossAmount), 0)', 'grossAmount')
      .addSelect('COALESCE(SUM(load.driverCostAmount), 0)', 'driverCostAmount')
      .addSelect('COALESCE(SUM(load.profitAmount), 0)', 'profitAmount')
      .addSelect('COALESCE(SUM(load.otrAmount), 0)', 'otrAmount')
      .addSelect('COALESCE(SUM(load.netProfitAmount), 0)', 'netProfitAmount')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .groupBy('load.weekId')
      .getRawMany();

    // Build a map for quick lookup
    const aggMap = new Map<string, typeof rawRows[0]>();
    for (const row of rawRows) {
      aggMap.set(row.weekId, row);
    }

    // Build weekly aggregation array in week order
    const weeklyData: WeeklyAggregation[] = weeks.map((w) => {
      const row = aggMap.get(w.id);
      return {
        weekId: w.id,
        weekLabel: w.label,
        startDate: w.startDate,
        endDate: w.endDate,
        loadCount: row ? Number(row.loadCount) : 0,
        grossAmount: round2(row ? Number(row.grossAmount) : 0),
        driverCostAmount: round2(row ? Number(row.driverCostAmount) : 0),
        profitAmount: round2(row ? Number(row.profitAmount) : 0),
        otrAmount: round2(row ? Number(row.otrAmount) : 0),
        netProfitAmount: round2(row ? Number(row.netProfitAmount) : 0),
      };
    });

    // Compute totals by summing the weekly aggregations
    const totals = {
      loadCount: 0,
      grossAmount: 0,
      driverCostAmount: 0,
      profitAmount: 0,
      otrAmount: 0,
      netProfitAmount: 0,
    };

    for (const w of weeklyData) {
      totals.loadCount += w.loadCount;
      totals.grossAmount += w.grossAmount;
      totals.driverCostAmount += w.driverCostAmount;
      totals.profitAmount += w.profitAmount;
      totals.otrAmount += w.otrAmount;
      totals.netProfitAmount += w.netProfitAmount;
    }

    // Round totals
    totals.grossAmount = round2(totals.grossAmount);
    totals.driverCostAmount = round2(totals.driverCostAmount);
    totals.profitAmount = round2(totals.profitAmount);
    totals.otrAmount = round2(totals.otrAmount);
    totals.netProfitAmount = round2(totals.netProfitAmount);

    return { totals, weeks: weeklyData };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
