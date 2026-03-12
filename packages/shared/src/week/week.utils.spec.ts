import {
  weekLabel,
  parseWeekLabel,
  weekDateRange,
  isoWeekOfDate,
} from './week.utils';

describe('weekLabel', () => {
  it('should format with zero-padded week', () => {
    expect(weekLabel(2026, 1)).toBe('LS2026-01');
    expect(weekLabel(2026, 11)).toBe('LS2026-11');
    expect(weekLabel(2025, 52)).toBe('LS2025-52');
  });
});

describe('parseWeekLabel', () => {
  it('should parse valid labels', () => {
    expect(parseWeekLabel('LS2026-11')).toEqual({ isoYear: 2026, isoWeek: 11 });
    expect(parseWeekLabel('LS2025-01')).toEqual({ isoYear: 2025, isoWeek: 1 });
  });

  it('should return null for invalid labels', () => {
    expect(parseWeekLabel('2026-11')).toBeNull();
    expect(parseWeekLabel('LS2026-0')).toBeNull();
    expect(parseWeekLabel('LS2026-54')).toBeNull();
    expect(parseWeekLabel('')).toBeNull();
  });
});

describe('weekDateRange', () => {
  it('should return Monday–Sunday for ISO week 11 of 2026', () => {
    const range = weekDateRange(2026, 11);
    expect(range.startDate).toBe('2026-03-09');
    expect(range.endDate).toBe('2026-03-15');
  });

  it('should return Monday–Sunday for ISO week 1 of 2026 (crosses year boundary)', () => {
    const range = weekDateRange(2026, 1);
    // 2026-01-01 is Thursday, so ISO week 1 starts Mon 2025-12-29
    expect(range.startDate).toBe('2025-12-29');
    expect(range.endDate).toBe('2026-01-04');
  });

  it('should handle ISO week 53 of 2026', () => {
    const range = weekDateRange(2026, 53);
    expect(range.startDate).toBe('2026-12-28');
    expect(range.endDate).toBe('2027-01-03');
  });

  it('should handle a year where Jan 1 is Monday (2024)', () => {
    // 2024-01-01 is Monday → ISO week 1 starts 2024-01-01
    const range = weekDateRange(2024, 1);
    expect(range.startDate).toBe('2024-01-01');
    expect(range.endDate).toBe('2024-01-07');
  });
});

describe('isoWeekOfDate', () => {
  it('should return correct ISO week for 2026-03-12 (Thursday of week 11)', () => {
    const result = isoWeekOfDate(new Date(2026, 2, 12));
    expect(result).toEqual({ isoYear: 2026, isoWeek: 11 });
  });

  it('should handle year boundary (Jan 1 2026 = ISO week 1)', () => {
    const result = isoWeekOfDate(new Date(2026, 0, 1));
    expect(result).toEqual({ isoYear: 2026, isoWeek: 1 });
  });

  it('should handle Dec 31 which may belong to next ISO year', () => {
    // Dec 31, 2026 is Thursday → ISO week 53 of 2026
    const result = isoWeekOfDate(new Date(2026, 11, 31));
    expect(result).toEqual({ isoYear: 2026, isoWeek: 53 });
  });

  it('should handle Jan 1 that belongs to previous ISO year (2028)', () => {
    // 2028-01-01 is Saturday → still ISO week 52 of 2027
    const result = isoWeekOfDate(new Date(2028, 0, 1));
    expect(result).toEqual({ isoYear: 2027, isoWeek: 52 });
  });

  it('should handle Dec 29 that belongs to next ISO year (2025-12-29)', () => {
    // 2025-12-29 is Monday → ISO week 1 of 2026
    const result = isoWeekOfDate(new Date(2025, 11, 29));
    expect(result).toEqual({ isoYear: 2026, isoWeek: 1 });
  });

  it('should be deterministic regardless of local timezone', () => {
    // Using explicit UTC dates to verify no TZ drift
    const dateA = new Date(Date.UTC(2026, 2, 12));
    const dateB = new Date(2026, 2, 12);
    const resultA = isoWeekOfDate(dateA);
    const resultB = isoWeekOfDate(dateB);
    expect(resultA).toEqual(resultB);
  });
});
