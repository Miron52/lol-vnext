import { Role } from './role.enum';

/**
 * Named actions that can be permission-checked.
 * Backend uses these as the source of truth; frontend mirrors for UI gating.
 */
export enum Action {
  // ── Salary Rules (Settings page) ──
  SalaryRulesRead = 'salary_rules:read',
  SalaryRulesCreate = 'salary_rules:create',
  SalaryRulesEdit = 'salary_rules:edit',
  SalaryRulesActivate = 'salary_rules:activate',

  // ── Salary ──
  SalaryPreview = 'salary:preview',
  SalaryGenerate = 'salary:generate',
  SalaryRecalculate = 'salary:recalculate',
  SalaryFreeze = 'salary:freeze',
  SalaryUnfreeze = 'salary:unfreeze',
  SalaryAdjust = 'salary:adjust',

  // ── Statements ──
  StatementsRead = 'statements:read',
  StatementsPreview = 'statements:preview',
  StatementsGenerate = 'statements:generate',

  // ── Loads ──
  LoadsRead = 'loads:read',
  LoadsCreate = 'loads:create',
  LoadsEdit = 'loads:edit',
  LoadsExport = 'loads:export',
  LoadsArchive = 'loads:archive',
}

/**
 * Permission matrix — maps each action to the roles that are allowed.
 *
 * Design principles:
 *   - Admin & Accountant can do everything
 *   - Dispatcher can view salary, use statements & export, manage loads (no archive)
 *   - Assistant can manage loads only (no salary / statement / export / archive)
 */
const PERMISSION_MATRIX: Record<Action, ReadonlySet<Role>> = {
  // Settings / Salary Rules — Admin + Accountant only
  [Action.SalaryRulesRead]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryRulesCreate]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryRulesEdit]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryRulesActivate]: new Set([Role.Admin, Role.Accountant]),

  // Salary — Admin + Accountant for mutations, + Dispatcher for read
  [Action.SalaryPreview]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher]),
  [Action.SalaryGenerate]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryRecalculate]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryFreeze]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryUnfreeze]: new Set([Role.Admin, Role.Accountant]),
  [Action.SalaryAdjust]: new Set([Role.Admin, Role.Accountant]),

  // Statements — Admin + Accountant + Dispatcher
  [Action.StatementsRead]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher]),
  [Action.StatementsPreview]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher]),
  [Action.StatementsGenerate]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher]),

  // Loads — all roles can CRUD; archive is restricted
  [Action.LoadsRead]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher, Role.Assistant]),
  [Action.LoadsCreate]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher, Role.Assistant]),
  [Action.LoadsEdit]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher, Role.Assistant]),
  [Action.LoadsExport]: new Set([Role.Admin, Role.Accountant, Role.Dispatcher]),
  [Action.LoadsArchive]: new Set([Role.Admin, Role.Accountant]),
};

/** Check whether a role is allowed a specific action. */
export function can(role: Role, action: Action): boolean {
  return PERMISSION_MATRIX[action]?.has(role) ?? false;
}

/** Check whether a role is allowed ANY of the given actions. */
export function canAny(role: Role, actions: Action[]): boolean {
  return actions.some((a) => can(role, a));
}

/** Get all actions a role is allowed. */
export function allowedActions(role: Role): Action[] {
  return Object.values(Action).filter((a) => can(role, a));
}
