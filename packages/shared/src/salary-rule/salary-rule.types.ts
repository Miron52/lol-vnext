/**
 * Salary Rule types for configurable dispatcher salary brackets.
 *
 * Salary brackets are managed through Settings and are never hardcoded.
 * The system supports any number of tiers with flat-rate application.
 */

/** A single tier row within a salary rule set. */
export interface SalaryRuleTier {
  /** 1-based ordinal position. */
  tierOrder: number;
  /** Inclusive lower bound ($). */
  minProfit: number;
  /** Exclusive upper bound ($). null = unbounded (top tier). */
  maxProfit: number | null;
  /** Flat-rate percentage applied to the entire Weekly Gross Profit. */
  percent: number;
}

/** Application mode for salary calculation. */
export type SalaryApplicationMode = 'flat_rate';

/** Salary base metric. */
export type SalaryBase = 'gross_profit';

/** Full salary rule set DTO returned by the API. */
export interface SalaryRuleDto {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  effectiveFrom: string; // ISO date string
  applicationMode: SalaryApplicationMode;
  salaryBase: SalaryBase;
  tiers: SalaryRuleTier[];
  createdById: string;
  createdByName: string;
  createdAt: string; // ISO datetime
}

/** Request body to create a new salary rule set. */
export interface CreateSalaryRuleRequest {
  name: string;
  effectiveFrom: string;
  tiers: SalaryRuleTier[];
}

/** Request body to update an existing salary rule set (creates new version). */
export interface UpdateSalaryRuleRequest {
  name?: string;
  effectiveFrom?: string;
  tiers?: SalaryRuleTier[];
}

/** Lightweight list item for rule set archive/list view. */
export interface SalaryRuleListItem {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  effectiveFrom: string;
  tierCount: number;
  createdByName: string;
  createdAt: string;
}
