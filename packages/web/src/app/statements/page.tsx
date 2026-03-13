'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { WeekDto, StatementDto, StatementArchiveItem, GenerateStatementRequest, StatementType } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useMasterData } from '@/lib/use-master-data';
import { useI18n } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, checkboxLabelStyle, fmt, tabBtnStyle, thStyle, tdStyle, tdRight, tableWrapperStyle, tableStyle, smallBtnStyle, primaryBtnStyle, loadingBtnStyle, accessDeniedStyle, accessDeniedSubtextStyle, badgeStyle, zebraRowProps, thAction, tdAction, colors, spacing } from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { EntityPicker } from '@/components/EntityPicker';
import { PageShell } from '@/components/PageShell';
import { StatementPreview } from './StatementPreview';

// ── Types ─────────────────────────────────────────────────────
type PaymentFilter = 'all' | 'quick_pay' | 'direct';

type ViewMode = 'form' | 'preview' | 'archive';

export default function StatementsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const { t } = useI18n();

  // ── State ───────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('form');
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [weekId, setWeekId] = useState('');
  const [statementType, setStatementType] = useState<StatementType>('driver');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [unitId, setUnitId] = useState('');

  const { items: unitItems, loading: unitsLoading } = useMasterData('units');

  const [preview, setPreview] = useState<StatementDto | null>(null);
  const [archive, setArchive] = useState<StatementArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Fetch weeks once ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    apiFetch<WeekDto[]>('/weeks').then((wks) => {
      setWeeks(wks);
      const current = wks.find((w) => w.isCurrent);
      if (current) setWeekId(current.id);
      else if (wks.length > 0) setWeekId(wks[0].id);
    });
  }, [user]);

  // ── Fetch archive when switching to archive view ────────────
  useEffect(() => {
    if (view !== 'archive' || !user) return;
    setLoading(true);
    setError(null);
    apiFetch<StatementArchiveItem[]>('/statements')
      .then((items) => { setArchive(items); setLoading(false); })
      .catch((err: unknown) => { setError(getErrorMessage(err)); setLoading(false); });
  }, [view, user]);

  // ── Preview handler ─────────────────────────────────────────
  async function handlePreview() {
    setError(null);
    setLoading(true);
    try {
      const body: GenerateStatementRequest = {
        statementType,
        weekId,
        paymentFilter,
        onlyUnpaid,
        ...(unitId.trim() ? { unitId: unitId.trim() } : {}),
      };
      const result = await apiFetch<StatementDto>('/statements/preview', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setPreview(result);
      setView('preview');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Save handler ────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body: GenerateStatementRequest = {
        statementType,
        weekId,
        paymentFilter,
        onlyUnpaid,
        ...(unitId.trim() ? { unitId: unitId.trim() } : {}),
      };
      await apiFetch<StatementDto>('/statements', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setView('archive');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ── View a single archived statement ────────────────────────
  async function handleViewArchived(id: string) {
    setLoading(true);
    setError(null);
    try {
      const stmt = await apiFetch<StatementDto>(`/statements/${id}`);
      setPreview(stmt);
      setView('preview');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Render guards ───────────────────────────────────────────
  if (authLoading) return <main style={{ padding: '2rem' }}><LoadingBox message={t('common.authenticating')} /></main>;
  if (!user) return null;

  if (!allowed(Action.StatementsRead)) {
    return (
      <PageShell breadcrumb={`/ ${t('stmt.title')}`} user={user} onLogout={logout} nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}>
        <div style={accessDeniedStyle}>
          <strong>{t('stmt.accessDenied')}</strong>
          <p style={accessDeniedSubtextStyle}>
            {t('stmt.accessDeniedHint')}
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumb={`/ ${t('stmt.title')}`}
      user={user}
      onLogout={logout}
      nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}
      title={t('stmt.title')}
      subtitle={t('stmt.subtitle')}
    >
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl }}>
        <button onClick={() => setView('form')} style={tabBtnStyle(view === 'form')}>{t('stmt.generate')}</button>
        <button onClick={() => setView('archive')} style={tabBtnStyle(view === 'archive')}>{t('stmt.archive')}</button>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Form view ── */}
      {view === 'form' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>{t('stmt.stmtType')}</label>
            <select style={inputStyle} value={statementType} onChange={(e) => setStatementType(e.target.value as StatementType)}>
              <option value="driver">{t('stmt.driver')}</option>
              <option value="owner">{t('stmt.owner')}</option>
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>{t('stmt.week')}</label>
            <select style={inputStyle} value={weekId} onChange={(e) => setWeekId(e.target.value)}>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.startDate} — {w.endDate}){w.isCurrent ? ` (${t('common.current')})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>{t('stmt.paymentFilter')}</label>
            <select style={inputStyle} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}>
              <option value="all">{t('stmt.allLoads')}</option>
              <option value="quick_pay">{t('stmt.quickPayOnly')}</option>
              <option value="direct">{t('stmt.directPaymentOnly')}</option>
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
              {t('stmt.onlyUnpaid')}
            </label>
          </div>
          <div style={{ marginBottom: spacing.xxl }}>
            <EntityPicker
              label={t('stmt.unitLabel')}
              value={unitId}
              onChange={setUnitId}
              items={unitItems}
              loading={unitsLoading}
              placeholder={t('stmt.unitPlaceholder')}
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !weekId}
            style={loadingBtnStyle(primaryBtnStyle, loading)}
          >
            {loading ? 'Loading...' : t('stmt.preview')}
          </button>
        </div>
      )}

      {/* ── Preview view ── */}
      {view === 'preview' && preview && (
        <StatementPreview
          statement={preview}
          onSave={handleSave}
          onClose={() => {
            setView(preview.id ? 'archive' : 'form');
            setPreview(null);
          }}
          saving={saving}
        />
      )}

      {/* ── Archive view ── */}
      {view === 'archive' && (
        <>
          {loading ? (
            <LoadingBox message={t('stmt.loadingArchive')} subtitle={t('stmt.fetchingSaved')} />
          ) : archive.length === 0 ? (
            <EmptyBox
              title={t('stmt.noStatements')}
              subtitle={t('stmt.noStatementsHint')}
              actionLabel={t('stmt.generate')}
              onAction={() => setView('form')}
            />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={{ ...tableStyle, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t('stmt.type')}</th>
                    <th style={thStyle}>{t('stmt.week')}</th>
                    <th style={thStyle}>{t('stmt.unitLabel')}</th>
                    <th style={thStyle}>{t('stmt.loads')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('stmt.gross')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('stmt.netProfit')}</th>
                    <th style={thStyle}>{t('stmt.generated')}</th>
                    <th style={thStyle}>{t('stmt.by')}</th>
                    <th style={thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {archive.map((s, idx) => {
                    const zebra = zebraRowProps(idx);
                    return (
                    <tr key={s.id} style={{ ...zebra.style, cursor: 'pointer' }} onClick={() => handleViewArchived(s.id)}
                      onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}
                    >
                      <td style={tdStyle}>
                        <span style={badgeStyle(s.statementType === 'driver' ? 'info' : 'purple')}>
                          {s.statementType}
                        </span>
                      </td>
                      <td style={tdStyle}>{s.weekLabel}</td>
                      <td style={tdStyle}>{s.unitId ? s.unitId.substring(0, 8) + '...' : '—'}</td>
                      <td style={tdStyle}>{s.loadCount}</td>
                      <td style={tdRight}>{fmt(s.totalGross)}</td>
                      <td style={{ ...tdRight, color: s.totalNetProfit >= 0 ? colors.teal : colors.danger }}>{fmt(s.totalNetProfit)}</td>
                      <td style={tdStyle}>{new Date(s.generatedAt).toLocaleString()}</td>
                      <td style={tdStyle}>{s.generatedByName}</td>
                      <td style={tdAction}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewArchived(s.id); }}
                          style={smallBtnStyle}
                        >
                          {t('stmt.view')}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
