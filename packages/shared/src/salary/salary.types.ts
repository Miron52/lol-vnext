/**
 * Salary v1 types — weekly dispatcher salary flow.
 */

import type { SalaryRuleTier } from '../salary-rule/salary-rule.types';

// ── Week State ──────────────────────────────────────────────────

export type SalaryWeekStatus = 'open' | 'generated' | 'frozen';

export interface SalaryWeekStateDto {
  weekId: string;
  weekLabel: string;
  status: SalaryWeekStatus;
  generatedAt: string | null;
  generatedByName: string | null;
  frozenAt: string | null;
  frozenByName: string | null;
}

// ── Audit ────────────────────────────────────────────────────────

export type SalaryAuditAction =
  | 'generate'
  | 'recalculate'
  | 'freeze'
  | 'unfreeze'
  | 'adjustment';

export interface SalaryAuditLogDto {
  id: string;
  weekId: string;
  action: SalaryAuditAction;
  performedByName: string;
  detail: string;
  createdAt: string;
}

// ── Adjustment types ────────────────────────────────────────────

export interface SalaryAdjustment {
  type: 'other' | 'bonus';
  amount: number;
  note: string;
  /** Who created this adjustment (stamped by backend at generate time). */
  createdBy: string;
  /** ISO timestamp when this adjustment was recorded. */
  createdAt: string;
}

// ── Snapshot (frozen at generation time) ────────────────────────

export interface SalarySnapshotLoadLine {
  loadId: string;
  sylNumber: string;
  date: string;
  fromAddress: string;
  toAddress: string;
  grossAmount: number;
  driverCostAmount: number;
  profitAmount: number;
}

export interface SalarySnapshot {
  dispatcherId: string;
  dispatcherName: string;
  weekId: string;
  weekLabel: string;
  /** Loads attributed to this dispatcher for this week. */
  loads: SalarySnapshotLoadLine[];
  /** Weekly Gross Profit = SUM(profitAmount). */
  weeklyGrossProfit: number;
  /** Rule set version at generation time. */
  ruleVersion: number;
  /** Rule set name for display. */
  ruleSetName: string;
  /** The full tier table from the rule set (for reconstruction). */
  tiers: SalaryRuleTier[];
  /** Which tier was matched. */
  matchedTier: number;
  /** The exact percentage applied. */
  appliedPercent: number;
  /** MAX(0, weeklyGrossProfit × appliedPercent / 100). */
  baseSalary: number;
  /** Manual adjustments. */
  adjustments: SalaryAdjustment[];
  /** SUM of Other adjustments. */
  totalOther: number;
  /** SUM of Bonus adjustments. */
  totalBonus: number;
  /** baseSalary + totalOther + totalBonus. */
  totalSalary: number;
}

// ── Row DTO (for the salary table) ──────────────────────────────

export interface SalaryRowDto {
  /** Salary record ID — empty string for preview (not yet persisted). */
  id: string;
  dispatcherId: string;
  dispatcherName: string;
  weekId: string;
  weekLabel: string;
  weeklyGrossProfit: number;
  appliedPercent: number;
  baseSalary: number;
  adjustments: SalaryAdjustment[];
  totalOther: number;
  totalBonus: number;
  totalSalary: number;
  ruleVersion: number;
  loadCount: number;
  /** Whether this row has been generated (persisted). */
  isGenerated: boolean;
  generatedAt: string | null;
  generatedByName: string | null;
}

// ── Full salary record DTO ──────────────────────────────────────

export interface SalaryRecordDto {
  id: string;
  dispatcherId: string;
  dispatcherName: string;
  weekId: string;
  weekLabel: string;
  snapshot: SalarySnapshot;
  generatedById: string;
  generatedByName: string;
  generatedAt: string;
}

// ── Request DTOs ────────────────────────────────────────────────

export interface SalaryPreviewRequest {
  weekId: string;
}

export interface GenerateSalaryRequest {
  weekId: string;
  dispatcherId: string;
  adjustments: SalaryAdjustment[];
}

export interface UpdateAdjustmentsRequest {
  adjustments: SalaryAdjustment[];
}
