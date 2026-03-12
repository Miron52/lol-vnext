/** Statement type: driver or owner. */
export type StatementType = 'driver' | 'owner';

/** A single load line inside a statement snapshot. */
export interface StatementLoadLine {
  sylNumber: string;
  date: string;
  fromAddress: string;
  toAddress: string;
  miles: number;
  grossAmount: number;
  driverCostAmount: number;
  profitAmount: number;
  otrAmount: number;
  netProfitAmount: number;
  quickPayFlag: boolean;
  directPaymentFlag: boolean;
  factoringFlag: boolean;
  driverPaidFlag: boolean;
}

/** Aggregated totals stored inside the statement snapshot. */
export interface StatementTotals {
  loadCount: number;
  grossAmount: number;
  driverCostAmount: number;
  profitAmount: number;
  otrAmount: number;
  netProfitAmount: number;
}

/** Full snapshot payload persisted as JSONB. */
export interface StatementSnapshot {
  loads: StatementLoadLine[];
  totals: StatementTotals;
}

/** API response for a generated statement. */
export interface StatementDto {
  id: string;
  statementType: StatementType;
  weekId: string;
  weekLabel: string;
  /** Unit filter used (null = all units). */
  unitId: string | null;
  generatedAt: string;
  generatedById: string;
  generatedByName: string;
  snapshot: StatementSnapshot;
}

/** Archive list item (lighter, no snapshot). */
export interface StatementArchiveItem {
  id: string;
  statementType: StatementType;
  weekId: string;
  weekLabel: string;
  unitId: string | null;
  loadCount: number;
  totalGross: number;
  totalNetProfit: number;
  generatedAt: string;
  generatedByName: string;
}

/** Request body to generate a statement. */
export interface GenerateStatementRequest {
  statementType: StatementType;
  weekId: string;
  paymentFilter?: string;   // 'all' | 'quick_pay' | 'direct'
  onlyUnpaid?: boolean;
  unitId?: string | null;
}
