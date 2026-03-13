'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SalaryRecordDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox } from '@/components/StateBoxes';
import {
  cardStyle,
  thStyle,
  tdStyle,
  tdRight,
  tableWrapperStyle,
  tableStyle,
  totalRowStyle,
  tagStyle,
  colors,
  fontSizes,
  spacing,
  fmt,
  fmtDate,
  secondaryBtnStyle,
} from '@/lib/styles';

export default function SalaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useI18n();

  const [record, setRecord] = useState<SalaryRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch<SalaryRecordDto>(`/salary/${id}`)
      .then(setRecord)
      .catch((e: unknown) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (authLoading) return <main style={{ padding: '2rem' }}><LoadingBox message={t('common.authenticating')} /></main>;
  if (!user) return null;

  const snap = record?.snapshot;

  return (
    <PageShell
      breadcrumb="/ Salary / Detail"
      user={user}
      onLogout={logout}
      nav={[
        { label: 'Home', href: '/' },
        { label: 'Salary', href: '/salary' },
      ]}
      title={snap ? `${snap.dispatcherName} — ${snap.weekLabel}` : 'Salary Detail'}
      subtitle={record ? `Generated ${fmtDate(record.generatedAt)} by ${record.generatedByName}` : undefined}
    >
      <div style={{ marginBottom: spacing.lg }}>
        <button onClick={() => router.push('/salary')} style={secondaryBtnStyle}>
          {t('sal.backToSalary')}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingBox message="Loading salary record..." />}

      {snap && (
        <>
          {/* ── Summary card ── */}
          <div style={{ ...cardStyle, marginBottom: spacing.xl }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing.lg }}>
              <SummaryItem label={t('sal.dispatcher')} value={snap.dispatcherName} />
              <SummaryItem label={t('sal.ruleSet')} value={snap.weekLabel} />
              <SummaryItem label={t('sal.grossProfit')} value={fmt(snap.weeklyGrossProfit)} />
              <SummaryItem label={t('sal.ruleSet')} value={snap.ruleSetName} />
              <SummaryItem label={t('sal.tier')} value={`Tier ${snap.matchedTier + 1} (${snap.appliedPercent}%)`} />
              <SummaryItem label={t('sal.baseSalary')} value={fmt(snap.baseSalary)} color={colors.primary} />
              <SummaryItem label={t('sal.other')} value={fmt(snap.totalOther)} />
              <SummaryItem label={t('sal.bonus')} value={fmt(snap.totalBonus)} color={colors.success} />
              <SummaryItem label={t('sal.totalSalary')} value={fmt(snap.totalSalary)} color={colors.text} bold />
            </div>
          </div>

          {/* ── Loads breakdown ── */}
          <div style={{ ...cardStyle, marginBottom: spacing.xl }}>
            <h3 style={{ margin: `0 0 ${spacing.md}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
              {t('stmt.loads')} ({snap.loads.length})
            </h3>
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t('table.sylNumber')}</th>
                    <th style={thStyle}>{t('table.date')}</th>
                    <th style={thStyle}>{t('table.from')}</th>
                    <th style={thStyle}>{t('table.to')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.gross')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.driverCost')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.profit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.loads.map((line) => (
                    <tr key={line.loadId}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{line.sylNumber}</td>
                      <td style={tdStyle}>{line.date}</td>
                      <td style={tdStyle}>{line.fromAddress}</td>
                      <td style={tdStyle}>{line.toAddress}</td>
                      <td style={tdRight}>{fmt(line.grossAmount)}</td>
                      <td style={tdRight}>{fmt(line.driverCostAmount)}</td>
                      <td style={{
                        ...tdRight,
                        color: line.profitAmount >= 0 ? colors.success : colors.danger,
                        fontWeight: 500,
                      }}>
                        {fmt(line.profitAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={totalRowStyle}>
                    <td style={tdStyle} colSpan={4}>{t('sal.total')}</td>
                    <td style={tdRight}>{fmt(snap.loads.reduce((s, l) => s + l.grossAmount, 0))}</td>
                    <td style={tdRight}>{fmt(snap.loads.reduce((s, l) => s + l.driverCostAmount, 0))}</td>
                    <td style={tdRight}>{fmt(snap.weeklyGrossProfit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Adjustments ── */}
          {snap.adjustments.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: spacing.xl }}>
              <h3 style={{ margin: `0 0 ${spacing.md}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
                Adjustments
              </h3>
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>{t('adj.type')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('adj.amount')}</th>
                      <th style={thStyle}>{t('adj.note')}</th>
                      <th style={thStyle}>{t('audit.by')}</th>
                      <th style={thStyle}>{t('table.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snap.adjustments.map((adj, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>
                          <span style={adj.type === 'bonus' ? tagStyle('solidSuccess') : tagStyle('solidInfo')}>
                            {adj.type === 'bonus' ? 'Bonus' : 'Other'}
                          </span>
                        </td>
                        <td style={tdRight}>{fmt(adj.amount)}</td>
                        <td style={tdStyle}>{adj.note || '—'}</td>
                        <td style={tdStyle}>{adj.createdBy}</td>
                        <td style={tdStyle}>{adj.createdAt ? fmtDate(adj.createdAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tier table ── */}
          <div style={{ ...cardStyle, marginBottom: spacing.xl }}>
            <h3 style={{ margin: `0 0 ${spacing.md}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
              Salary Rule Tiers (v{snap.ruleVersion})
            </h3>
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tier</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Min Profit</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Max Profit</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.tiers.map((tier, idx) => (
                    <tr key={idx} style={idx === snap.matchedTier ? { background: colors.successBg } : {}}>
                      <td style={{ ...tdStyle, fontWeight: idx === snap.matchedTier ? 600 : 400 }}>
                        Tier {idx + 1}
                        {idx === snap.matchedTier && (
                          <span style={{ ...tagStyle('solidSuccess'), marginLeft: 8 }}>Applied</span>
                        )}
                      </td>
                      <td style={tdRight}>{fmt(tier.minProfit)}</td>
                      <td style={tdRight}>{tier.maxProfit != null ? fmt(tier.maxProfit) : '∞'}</td>
                      <td style={tdRight}>{tier.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

function SummaryItem({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: fontSizes.lg, fontWeight: bold ? 700 : 600, color: color || colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}
