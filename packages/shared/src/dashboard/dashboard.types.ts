/** Aggregated totals for a single week. */
export interface WeeklyAggregation {
  weekId: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  loadCount: number;
  grossAmount: number;
  driverCostAmount: number;
  profitAmount: number;
  otrAmount: number;
  netProfitAmount: number;
}

/** Dashboard v1 API response. */
export interface DashboardDto {
  /** Totals across all weeks in the range. */
  totals: {
    loadCount: number;
    grossAmount: number;
    driverCostAmount: number;
    profitAmount: number;
    otrAmount: number;
    netProfitAmount: number;
  };
  /** Per-week breakdown, ordered oldest to newest (for charts). */
  weeks: WeeklyAggregation[];
}
