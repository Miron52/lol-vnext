/**
 * Finance Engine v1 — single source of truth for derived financial fields.
 * Used by API (authoritative) and frontend (preview only).
 *
 * Contract:
 *   Profit        = GrossAmount − DriverCostAmount
 *   ProfitPercent  = (Profit / GrossAmount) × 100, or 0 when GrossAmount = 0
 *   OTR           = GrossAmount × 0.0125
 *   NetProfitV1   = Profit − OTR
 *
 * All values rounded to 2 decimal places.
 */

/** OTR rate: 1.25% of gross. */
export const OTR_RATE = 0.0125;

/** Profit = Gross − Driver Cost */
export function calcProfit(grossAmount: number, driverCostAmount: number): number {
  return Math.round((grossAmount - driverCostAmount) * 100) / 100;
}

/** Profit % = (Profit / Gross) × 100. Returns 0 when Gross is 0. */
export function calcProfitPercent(grossAmount: number, profitAmount: number): number {
  if (grossAmount === 0) return 0;
  return Math.round((profitAmount / grossAmount) * 10000) / 100;
}

/** OTR = GrossAmount × 0.0125 */
export function calcOtr(grossAmount: number): number {
  return Math.round(grossAmount * OTR_RATE * 100) / 100;
}

/** Net Profit v1 = Profit − OTR */
export function calcNetProfitV1(profitAmount: number, otrAmount: number): number {
  return Math.round((profitAmount - otrAmount) * 100) / 100;
}

/** Compute all derived finance fields from gross + driver cost. */
export interface FinanceBreakdown {
  profitAmount: number;
  profitPercent: number;
  otrAmount: number;
  netProfitAmount: number;
}

export function calcFinanceBreakdown(grossAmount: number, driverCostAmount: number): FinanceBreakdown {
  const profitAmount = calcProfit(grossAmount, driverCostAmount);
  const profitPercent = calcProfitPercent(grossAmount, profitAmount);
  const otrAmount = calcOtr(grossAmount);
  const netProfitAmount = calcNetProfitV1(profitAmount, otrAmount);
  return { profitAmount, profitPercent, otrAmount, netProfitAmount };
}
