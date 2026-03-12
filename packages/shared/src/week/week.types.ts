/** API response shape for a single week. */
export interface WeekDto {
  id: string;
  label: string;       // LS2026-11
  isoYear: number;     // 2026
  isoWeek: number;     // 11
  startDate: string;   // 2026-03-09 (Monday)
  endDate: string;     // 2026-03-15 (Sunday)
  isCurrent: boolean;
}
