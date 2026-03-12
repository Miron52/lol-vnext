/**
 * Week utilities for LOL vNext.
 *
 * Single canonical label format: LS{YYYY}-{WW}
 * Examples: LS2026-01, LS2026-11, LS2026-52
 *
 * ISO 8601 week numbering is used throughout.
 */

/** Build canonical week label. */
export function weekLabel(isoYear: number, isoWeek: number): string {
  return `LS${isoYear}-${String(isoWeek).padStart(2, '0')}`;
}

/** Parse a week label back into { isoYear, isoWeek }. Returns null on bad input. */
export function parseWeekLabel(
  label: string,
): { isoYear: number; isoWeek: number } | null {
  const m = label.match(/^LS(\d{4})-(\d{2})$/);
  if (!m) return null;
  const isoYear = parseInt(m[1], 10);
  const isoWeek = parseInt(m[2], 10);
  if (isoWeek < 1 || isoWeek > 53) return null;
  return { isoYear, isoWeek };
}

/**
 * Compute the Monday (start) and Sunday (end) of an ISO week.
 *
 * Algorithm: Jan 4 is always in ISO week 1.
 * Monday of week 1 = Jan 4 − (dayOfWeek(Jan4) − 1) days.
 * Monday of week W = Monday of week 1 + (W − 1) × 7 days.
 */
export function weekDateRange(
  isoYear: number,
  isoWeek: number,
): { startDate: string; endDate: string } {
  // Jan 4 of the ISO year is always in week 1
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // convert Sunday=0 to 7
  // Monday of ISO week 1
  const mondayW1 = new Date(jan4.getTime());
  mondayW1.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));
  // Monday of requested week
  const monday = new Date(mondayW1.getTime());
  monday.setUTCDate(mondayW1.getUTCDate() + (isoWeek - 1) * 7);
  // Sunday = Monday + 6
  const sunday = new Date(monday.getTime());
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startDate: fmtDate(monday),
    endDate: fmtDate(sunday),
  };
}

/** Get the ISO year and ISO week number for a given date. */
export function isoWeekOfDate(date: Date): { isoYear: number; isoWeek: number } {
  // Copy to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 − current day number (Mon=1..Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // ISO year is the year of that Thursday
  const isoYear = d.getUTCFullYear();
  // Week number = ceil((ordinalDay of Thursday) / 7)
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const diff = d.getTime() - jan1.getTime();
  const isoWeek = Math.ceil((diff / 86400000 + 1) / 7);
  return { isoYear, isoWeek };
}

/** Format a Date as YYYY-MM-DD. */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
