'use client';

import { useState } from 'react';
import type { WeeklyAggregation, TopCorridor } from '@lol/shared';
import { cardStyle, fontSizes, spacing, colors, fontFamily, radii } from '@/lib/styles';
import { useI18n } from '@/lib/i18n';

/* ─────────────────────────── helpers ────────────────────────── */

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(value) >= 1_000) return '$' + (value / 1_000).toFixed(1) + 'K';
  return '$' + value.toFixed(0);
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const parts = d.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parts[1] - 1]} ${parts[2]}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function shortWeekLabel(label: string): string {
  const m = label.match(/(\d+)$/);
  return m ? `W${m[1]}` : label;
}

function shouldRotateLabels(count: number): boolean {
  return count > 10;
}

/* ───────── Metric configuration & colors ───────────────────── */

export const METRIC_COLORS = {
  gross: '#3b82f6',
  driverCost: '#f97316',
  profit: '#8b5cf6',
  otr: '#0d9488',
  netProfit: '#16a34a',
  loads: '#2563eb',
} as const;

export type MetricKey = 'gross' | 'driver' | 'profit' | 'otr' | 'net';

interface MetricDef {
  key: MetricKey;
  i18nKey: string;
  color: string;
}

const ALL_METRICS: MetricDef[] = [
  { key: 'gross', i18nKey: 'col.gross', color: METRIC_COLORS.gross },
  { key: 'driver', i18nKey: 'col.driver', color: METRIC_COLORS.driverCost },
  { key: 'profit', i18nKey: 'col.profit', color: METRIC_COLORS.profit },
  { key: 'otr', i18nKey: 'col.otr', color: METRIC_COLORS.otr },
  { key: 'net', i18nKey: 'col.net', color: METRIC_COLORS.netProfit },
];

const DEFAULT_VISIBLE: MetricKey[] = ['gross', 'driver', 'net'];

/* ═══════════════════════════════════════════════════════════════
   CHART INFRASTRUCTURE
   ═══════════════════════════════════════════════════════════════ */

function ChartCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...cardStyle, position: 'relative', ...style }}>{children}</div>;
}

function ChartHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: fontSizes.md, fontWeight: 600, color: colors.text, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: 400 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: 'inline-block', flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({ visible, left, top, children }: { visible: boolean; left: number; top: number; children: React.ReactNode }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', left, top, transform: 'translateX(-50%)',
      background: colors.bgWhite, border: `1px solid ${colors.border}`, borderRadius: radii.md,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px', zIndex: 10,
      minWidth: 200, pointerEvents: 'none', fontFamily,
    }}>
      {children}
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0', fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: 1, background: color, flexShrink: 0 }} />
        <span style={{ color: colors.textSecondary }}>{label}</span>
      </div>
      <span style={{ fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums', marginLeft: 16 }}>{value}</span>
    </div>
  );
}

function YGrid({ steps, chartHeight, padLeft, padRight, chartWidth, labelFn }: {
  steps: number[]; chartHeight: number; padLeft: number; padRight: number; chartWidth: number;
  labelFn: (frac: number) => string;
}) {
  return (
    <>
      {steps.map((frac) => {
        const y = chartHeight - frac * chartHeight;
        return (
          <g key={frac}>
            <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y}
              stroke={frac === 0 ? colors.border : '#eef2f6'} strokeWidth={1}
              strokeDasharray={frac > 0 ? '4,3' : 'none'} />
            <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize={10} fill={colors.textMuted} fontFamily={fontFamily}>
              {labelFn(frac)}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Column Toggle Panel
   ═══════════════════════════════════════════════════════════════ */

function ColumnToggle({
  metrics,
  visible,
  onToggle,
}: {
  metrics: MetricDef[];
  visible: MetricKey[];
  onToggle: (key: MetricKey) => void;
}) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, alignSelf: 'center', marginRight: 4 }}>
        {t('chart.columns')}:
      </span>
      {metrics.map((m) => {
        const active = visible.includes(m.key);
        return (
          <button
            key={m.key}
            onClick={() => onToggle(m.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', border: `1px solid ${active ? m.color : colors.borderSubtle}`,
              borderRadius: radii.md, background: active ? `${m.color}10` : colors.bgWhite,
              cursor: 'pointer', fontSize: 11, fontWeight: 500,
              color: active ? m.color : colors.textMuted,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: active ? m.color : colors.borderSubtle,
            }} />
            {t(m.i18nKey)}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CHART — Revenue, Cost & Net Profit (configurable columns)
   ═══════════════════════════════════════════════════════════════ */

export function RevenueCostChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<MetricKey[]>(DEFAULT_VISIBLE);

  if (weeks.length === 0) return null;

  const toggleMetric = (key: MetricKey) => {
    setVisibleMetrics((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key],
    );
  };

  const activeSeries = ALL_METRICS.filter((m) => visibleMetrics.includes(m.key));

  const data = weeks.map((w) => ({
    label: w.weekLabel,
    startDate: w.startDate,
    endDate: w.endDate,
    gross: w.grossAmount,
    driver: w.driverCostAmount,
    profit: w.profitAmount,
    otr: w.otrAmount,
    net: w.netProfitAmount,
    loadCount: w.loadCount,
    margin: w.grossAmount > 0 ? Math.round((w.profitAmount / w.grossAmount) * 10000) / 100 : 0,
  }));

  const maxVal = Math.max(
    ...data.flatMap((d) => activeSeries.map((s) => Math.abs(d[s.key]))),
    1,
  );
  const rotate = shouldRotateLabels(weeks.length);

  const chartH = 260;
  const barW = Math.max(10, Math.min(22, 400 / (weeks.length * activeSeries.length)));
  const barGap = 2;
  const groupInner = activeSeries.length * barW + (activeSeries.length - 1) * barGap;
  const groupPad = Math.max(8, Math.min(28, 600 / weeks.length));
  const groupW = groupInner + groupPad;
  const padL = 62;
  const padR = 16;
  const padBottom = rotate ? 52 : 36;
  const svgW = Math.max(480, weeks.length * groupW + padL + padR);

  return (
    <ChartCard>
      <ChartHeader title={t('chart.revenueCostNet')} subtitle={t('chart.weeklyOverview')} />
      <ColumnToggle metrics={ALL_METRICS} visible={visibleMetrics} onToggle={toggleMetric} />
      <Legend items={activeSeries.map((s) => ({ label: t(s.i18nKey), color: s.color }))} />

      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <svg width={svgW} height={chartH + padBottom} viewBox={`0 0 ${svgW} ${chartH + padBottom}`}
          style={{ fontFamily, display: 'block' }} onMouseLeave={() => setHoverIdx(null)}>
          <YGrid steps={[0, 0.25, 0.5, 0.75, 1]} chartHeight={chartH} padLeft={padL} padRight={padR}
            chartWidth={svgW} labelFn={(f) => formatCompact(maxVal * f)} />

          {data.map((d, i) => {
            const gx = padL + groupPad / 2 + i * groupW;
            const hovered = hoverIdx === i;
            return (
              <g key={d.label} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoverIdx(i)}>
                <rect x={gx - 6} y={0} width={groupInner + 12} height={chartH}
                  fill={hovered ? 'rgba(15,23,42,0.03)' : 'transparent'} rx={4} />

                {activeSeries.map((s, si) => {
                  const val = d[s.key];
                  const h = Math.max(0, (Math.abs(val) / maxVal) * chartH);
                  const bx = gx + si * (barW + barGap);
                  return (
                    <g key={s.key}>
                      <rect x={bx} y={chartH - h} width={barW} height={h} fill={s.color} rx={3}
                        opacity={hovered ? 1 : 0.85} />
                      {hovered && h > 16 && (
                        <text x={bx + barW / 2} y={chartH - h + 12} textAnchor="middle" fontSize={8}
                          fontWeight={600} fill="#fff" fontFamily={fontFamily}>
                          {formatCompact(val)}
                        </text>
                      )}
                    </g>
                  );
                })}

                <text x={gx + groupInner / 2} y={chartH + (rotate ? 10 : 14)}
                  textAnchor={rotate ? 'end' : 'middle'} fontSize={rotate ? 9 : 10}
                  fill={hovered ? colors.text : colors.textMuted} fontWeight={hovered ? 600 : 400}
                  fontFamily={fontFamily}
                  transform={rotate ? `rotate(-45, ${gx + groupInner / 2}, ${chartH + 10})` : undefined}>
                  {rotate ? shortWeekLabel(d.label) : d.label}
                </text>
              </g>
            );
          })}
        </svg>

        <ChartTooltip visible={hoverIdx !== null}
          left={padL + groupPad / 2 + (hoverIdx ?? 0) * groupW + groupInner / 2} top={8}>
          {hoverIdx !== null && data[hoverIdx] && (() => {
            const d = data[hoverIdx];
            return (
              <>
                <div style={{ fontWeight: 600, fontSize: 12, color: colors.text, marginBottom: 2 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 6, paddingBottom: 4,
                  borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  {formatDateRange(d.startDate, d.endDate)} &middot; {d.loadCount} {t(d.loadCount !== 1 ? 'loads.loads' : 'loads.load')}
                </div>
                <TooltipRow label={t('col.gross')} value={formatCurrency(d.gross)} color={METRIC_COLORS.gross} />
                <TooltipRow label={t('col.driver')} value={formatCurrency(d.driver)} color={METRIC_COLORS.driverCost} />
                <TooltipRow label={t('col.profit')} value={formatCurrency(d.profit)} color={METRIC_COLORS.profit} />
                <TooltipRow label={t('col.otr')} value={formatCurrency(d.otr)} color={METRIC_COLORS.otr} />
                <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, marginTop: 4, paddingTop: 4 }}>
                  <TooltipRow label={t('col.net')} value={formatCurrency(d.net)} color={METRIC_COLORS.netProfit} />
                  <TooltipRow label={t('chart.lolCount')} value={String(d.loadCount)} color={METRIC_COLORS.loads} />
                </div>
              </>
            );
          })()}
        </ChartTooltip>
      </div>
    </ChartCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 2 — Load Volume (compact)
   ═══════════════════════════════════════════════════════════════ */

export function LoadVolumeChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (weeks.length === 0) return null;

  const data = weeks.map((w) => ({
    label: w.weekLabel,
    startDate: w.startDate,
    endDate: w.endDate,
    count: w.loadCount,
    gross: w.grossAmount,
    net: w.netProfitAmount,
    avgGross: w.loadCount > 0 ? Math.round(w.grossAmount / w.loadCount) : 0,
  }));
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalLoads = data.reduce((s, d) => s + d.count, 0);
  const rotate = shouldRotateLabels(weeks.length);

  const chartH = 180;
  const barW = Math.max(12, Math.min(28, 300 / weeks.length));
  const groupPad = Math.max(4, Math.min(20, 500 / weeks.length));
  const groupW = barW + groupPad;
  const padL = 40;
  const padR = 12;
  const padBottom = rotate ? 52 : 36;
  const svgW = Math.max(300, weeks.length * groupW + padL + padR);

  return (
    <ChartCard>
      <ChartHeader title={t('chart.loadVolume')} subtitle={t('chart.totalLoadsDispatched', { count: totalLoads })} />

      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <svg width={svgW} height={chartH + padBottom} viewBox={`0 0 ${svgW} ${chartH + padBottom}`}
          style={{ fontFamily, display: 'block' }} onMouseLeave={() => setHoverIdx(null)}>
          {[0, 0.5, 1].map((frac) => {
            const y = chartH - frac * chartH;
            return (
              <g key={frac}>
                <line x1={padL} y1={y} x2={svgW - padR} y2={y}
                  stroke={frac === 0 ? colors.border : '#eef2f6'} strokeWidth={1}
                  strokeDasharray={frac > 0 ? '4,3' : 'none'} />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={10}
                  fill={colors.textMuted} fontFamily={fontFamily}>
                  {Math.round(maxCount * frac)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const bx = padL + groupPad / 2 + i * groupW;
            const h = Math.max(0, (d.count / maxCount) * chartH);
            const hovered = hoverIdx === i;
            return (
              <g key={d.label} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoverIdx(i)}>
                <rect x={bx - 4} y={0} width={barW + 8} height={chartH}
                  fill={hovered ? 'rgba(15,23,42,0.03)' : 'transparent'} rx={4} />
                <rect x={bx} y={chartH - h} width={barW} height={h} fill={METRIC_COLORS.loads} rx={4}
                  opacity={hovered ? 1 : 0.7} />
                {hovered && (
                  <text x={bx + barW / 2} y={chartH - h - 6} textAnchor="middle" fontSize={11}
                    fontWeight={700} fill={METRIC_COLORS.loads} fontFamily={fontFamily}>
                    {d.count}
                  </text>
                )}
                <text x={bx + barW / 2} y={chartH + (rotate ? 10 : 14)}
                  textAnchor={rotate ? 'end' : 'middle'} fontSize={rotate ? 9 : 10}
                  fill={hovered ? colors.text : colors.textMuted} fontWeight={hovered ? 600 : 400}
                  fontFamily={fontFamily}
                  transform={rotate ? `rotate(-45, ${bx + barW / 2}, ${chartH + 10})` : undefined}>
                  {rotate ? shortWeekLabel(d.label) : d.label}
                </text>
              </g>
            );
          })}
        </svg>

        <ChartTooltip visible={hoverIdx !== null}
          left={padL + groupPad / 2 + (hoverIdx ?? 0) * groupW + barW / 2} top={8}>
          {hoverIdx !== null && data[hoverIdx] && (() => {
            const d = data[hoverIdx];
            const pctOfTotal = totalLoads > 0 ? ((d.count / totalLoads) * 100).toFixed(1) : '0';
            return (
              <>
                <div style={{ fontWeight: 600, fontSize: 12, color: colors.text, marginBottom: 2 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 6, paddingBottom: 4,
                  borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  {formatDateRange(d.startDate, d.endDate)}
                </div>
                <TooltipRow label={t('chart.loads')} value={`${d.count} (${pctOfTotal}%)`} color={METRIC_COLORS.loads} />
                <TooltipRow label={t('col.gross')} value={formatCurrency(d.gross)} color={METRIC_COLORS.gross} />
                <TooltipRow label={t('col.net')} value={formatCurrency(d.net)} color={METRIC_COLORS.netProfit} />
                <TooltipRow label={t('chart.avgGrossLoad')} value={formatCurrency(d.avgGross)} color={colors.textSecondary} />
              </>
            );
          })()}
        </ChartTooltip>
      </div>
    </ChartCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEGACY EXPORTS (backward compatibility)
   ═══════════════════════════════════════════════════════════════ */

export function SpecialProfitStatsChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  return <RevenueCostChart weeks={weeks} />;
}
export function ProfitStatsChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  return <RevenueCostChart weeks={weeks} />;
}

/* ──────────────── Top corridors table ────────────────────────── */

export function TopCorridorsCard({ corridors }: { corridors: TopCorridor[] }) {
  const { t } = useI18n();
  if (corridors.length === 0) return null;

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px', borderBottom: `1px solid ${colors.borderSubtle}`,
    fontSize: fontSizes.sm, color: colors.text,
  };
  const headerCellStyle: React.CSSProperties = {
    ...cellStyle, fontWeight: 600, fontSize: fontSizes.xs, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${colors.border}`,
  };
  const numCellStyle: React.CSSProperties = { ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ ...cardStyle, minWidth: 300 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        {t('chart.topCorridors')}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>{t('corridors.route')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.loads')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.gross')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.driver')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.profit')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.otr')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.netProfit')}</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t('corridors.margin')}</th>
            </tr>
          </thead>
          <tbody>
            {corridors.map((c, i) => {
              const margin = c.grossAmount > 0 ? (c.profitAmount / c.grossAmount) * 100 : 0;
              return (
                <tr key={i} style={{ background: i % 2 === 1 ? colors.bgMuted : 'transparent' }}>
                  <td style={cellStyle}>
                    <span style={{ fontWeight: 500 }}>{c.fromState}</span>
                    <span style={{ color: colors.textMuted, margin: '0 4px' }}>&rarr;</span>
                    <span style={{ fontWeight: 500 }}>{c.toState}</span>
                  </td>
                  <td style={numCellStyle}>{c.loadCount}</td>
                  <td style={numCellStyle}>{formatCurrency(c.grossAmount)}</td>
                  <td style={numCellStyle}>{formatCurrency(c.driverCostAmount)}</td>
                  <td style={{ ...numCellStyle, color: c.profitAmount >= 0 ? colors.success : colors.danger, fontWeight: 500 }}>
                    {formatCurrency(c.profitAmount)}
                  </td>
                  <td style={numCellStyle}>{formatCurrency(c.otrAmount)}</td>
                  <td style={{ ...numCellStyle, color: c.netProfitAmount >= 0 ? colors.success : colors.danger, fontWeight: 500 }}>
                    {formatCurrency(c.netProfitAmount)}
                  </td>
                  <td style={{ ...numCellStyle, color: margin >= 0 ? colors.success : colors.danger }}>
                    {margin.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────── Flag summary progress bars ────────────────── */

export function FlagSummaryCard({
  flags, totalLoads,
}: {
  flags: { quickPay: number; directPayment: number; factoring: number; driverPaid: number };
  totalLoads: number;
}) {
  const { t } = useI18n();
  const items = [
    { label: t('flag.quickPay'), count: flags.quickPay, color: '#f59e0b' },
    { label: t('flag.directPayment'), count: flags.directPayment, color: '#3b82f6' },
    { label: t('flag.factoring'), count: flags.factoring, color: '#8b5cf6' },
    { label: t('flag.driverPaid'), count: flags.driverPaid, color: '#16a34a' },
  ];
  const allZero = items.every((item) => item.count === 0);

  return (
    <div style={{ ...cardStyle, minWidth: 260 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        {t('chart.paymentFlags')}
      </h3>
      {allZero && (
        <div style={{ fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: 12, padding: '8px 12px',
          background: colors.bgMuted, borderRadius: radii.md, border: `1px solid ${colors.borderSubtle}` }}>
          {t('chart.noFlagsSet')}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => {
          const pct = totalLoads > 0 ? (item.count / totalLoads) * 100 : 0;
          return (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: fontSizes.sm }}>
                <span style={{ color: colors.textSecondary }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: colors.text }}>
                  {item.count} <span style={{ color: colors.textMuted, fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div style={{ height: 6, background: colors.borderSubtle, borderRadius: radii.sm, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: radii.sm, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────── Sparkline ──────────────────────────────────── */

export function Sparkline({
  data, color = colors.primary, width = 80, height = 28,
}: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((v - min) / range) * (height - 2 * pad);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
