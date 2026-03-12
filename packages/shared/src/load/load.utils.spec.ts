import { calcProfit, calcProfitPercent, calcOtr, calcNetProfitV1, calcFinanceBreakdown, OTR_RATE } from './load.utils';

describe('calcProfit', () => {
  it('should compute gross minus driver cost', () => {
    expect(calcProfit(5000, 3500)).toBe(1500);
  });

  it('should handle zero gross', () => {
    expect(calcProfit(0, 0)).toBe(0);
  });

  it('should handle negative profit (driver cost > gross)', () => {
    expect(calcProfit(1000, 1200)).toBe(-200);
  });

  it('should round to 2 decimal places', () => {
    expect(calcProfit(100.555, 50.333)).toBe(50.22);
  });
});

describe('calcProfitPercent', () => {
  it('should compute (profit / gross) * 100', () => {
    expect(calcProfitPercent(5000, 1500)).toBe(30);
  });

  it('should return 0 when gross is 0', () => {
    expect(calcProfitPercent(0, 0)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    // 1250 / 4360 * 100 = 28.669... → 28.67
    expect(calcProfitPercent(4360, 1250)).toBe(28.67);
  });

  it('should handle PRD example: profit 775 from gross', () => {
    // Profit $775, Gross = 775 / 0.08 ≈ 9687.5 — just test percent calc
    expect(calcProfitPercent(9687.5, 775)).toBe(8);
  });
});

describe('OTR_RATE', () => {
  it('should be 1.25%', () => {
    expect(OTR_RATE).toBe(0.0125);
  });
});

describe('calcOtr', () => {
  it('should compute 1.25% of gross', () => {
    expect(calcOtr(5000)).toBe(62.5);
  });

  it('should return 0 for zero gross', () => {
    expect(calcOtr(0)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    // 3333 * 0.0125 = 41.6625 → 41.66
    expect(calcOtr(3333)).toBe(41.66);
  });

  it('should handle small amounts', () => {
    // 100 * 0.0125 = 1.25
    expect(calcOtr(100)).toBe(1.25);
  });
});

describe('calcNetProfitV1', () => {
  it('should compute profit minus OTR', () => {
    expect(calcNetProfitV1(1500, 62.5)).toBe(1437.5);
  });

  it('should handle zero values', () => {
    expect(calcNetProfitV1(0, 0)).toBe(0);
  });

  it('should handle negative net profit', () => {
    // e.g. very thin margin where OTR exceeds profit
    expect(calcNetProfitV1(10, 62.5)).toBe(-52.5);
  });

  it('should round to 2 decimal places', () => {
    // 1500.555 - 62.333 = 1438.222 → 1438.22
    expect(calcNetProfitV1(1500.555, 62.333)).toBe(1438.22);
  });
});

describe('calcFinanceBreakdown', () => {
  it('should compute all derived fields for normal case', () => {
    const result = calcFinanceBreakdown(5000, 3500);
    expect(result).toEqual({
      profitAmount: 1500,
      profitPercent: 30,
      otrAmount: 62.5,
      netProfitAmount: 1437.5,
    });
  });

  it('should handle zero gross safely', () => {
    const result = calcFinanceBreakdown(0, 0);
    expect(result).toEqual({
      profitAmount: 0,
      profitPercent: 0,
      otrAmount: 0,
      netProfitAmount: 0,
    });
  });

  it('should handle negative-margin case (driver cost > gross)', () => {
    const result = calcFinanceBreakdown(1000, 1200);
    expect(result).toEqual({
      profitAmount: -200,
      profitPercent: -20,
      otrAmount: 12.5,
      netProfitAmount: -212.5,
    });
  });

  it('should round all values to 2 decimals', () => {
    // gross=3333, driver=2222
    // profit = 1111, profitPercent = 33.33, otr = 41.66, net = 1069.34
    const result = calcFinanceBreakdown(3333, 2222);
    expect(result.profitAmount).toBe(1111);
    expect(result.profitPercent).toBe(33.33);
    expect(result.otrAmount).toBe(41.66);
    expect(result.netProfitAmount).toBe(1069.34);
  });
});
