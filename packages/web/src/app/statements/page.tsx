'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { WeekDto, StatementDto, StatementArchiveItem, GenerateStatementRequest, StatementType } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, checkboxLabelStyle, fmt } from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { PageShell } from '@/components/PageShell';
import { StatementPreview } from './StatementPreview';

// ── Types ─────────────────────────────────────────────────────
type PaymentFilter = 'all' | 'quick_pay' | 'direct';
const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All Loads' },
  { value: 'quick_pay', label: 'Quick Pay Only' },
  { value: 'direct', label: 'Direct Payment Only' },
];

type ViewMode = 'form' | 'preview' | 'archive';

export default function StatementsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('form');
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [weekId, setWeekId] = useState('');
  const [statementType, setStatementType] = useState<StatementType>('driver');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [unitId, setUnitId] = useState('');

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
  if (authLoading) return <main style={{ padding: '2rem' }}>Loading...</main>;
  if (!user) return null;

  if (!allowed(Action.StatementsRead)) {
    return (
      <PageShell breadcrumb="/ Statements" user={user} onLogout={logout} nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#d32f2f',
          background: '#fff5f5',
          borderRadius: 6,
          border: '1px solid #ffcdd2',
        }}>
          <strong>Access Denied</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.875rem' }}>
            You do not have permission to view statements. Contact an administrator if you need access.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="/ Statements" user={user} onLogout={logout} nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}>
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => setView('form')} style={tabBtn(view === 'form')}>Generate</button>
        <button onClick={() => setView('archive')} style={tabBtn(view === 'archive')}>Archive</button>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Form view ── */}
      {view === 'form' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Statement Type</label>
            <select style={inputStyle} value={statementType} onChange={(e) => setStatementType(e.target.value as StatementType)}>
              <option value="driver">Driver</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Week</label>
            <select style={inputStyle} value={weekId} onChange={(e) => setWeekId(e.target.value)}>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.startDate} — {w.endDate}){w.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Payment Filter</label>
            <select style={inputStyle} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}>
              {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
              Only Unpaid (driver not paid)
            </label>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Unit ID (optional)</label>
            <input style={inputStyle} value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="UUID (optional)" />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !weekId}
            style={{
              padding: '0.5rem 1.5rem',
              background: loading ? '#999' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'default' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {loading ? 'Loading...' : 'Preview Statement'}
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
            <LoadingBox message="Loading archive..." />
          ) : archive.length === 0 ? (
            <EmptyBox title="No statements generated yet." subtitle="Use the Generate tab to create one." />
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    {['Type', 'Week', 'Unit', 'Loads', 'Gross', 'Net Profit', 'Generated', 'By', ''].map((h) => (
                      <th key={h} style={archiveThStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archive.map((s) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => handleViewArchived(s.id)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#f5f9ff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                    >
                      <td style={archiveTdStyle}>
                        <span style={{ background: s.statementType === 'driver' ? '#e3f2fd' : '#f3e5f5', padding: '2px 8px', borderRadius: 3, fontSize: '0.75rem', fontWeight: 600 }}>
                          {s.statementType}
                        </span>
                      </td>
                      <td style={archiveTdStyle}>{s.weekLabel}</td>
                      <td style={archiveTdStyle}>{s.unitId ? s.unitId.substring(0, 8) + '...' : '—'}</td>
                      <td style={archiveTdStyle}>{s.loadCount}</td>
                      <td style={{ ...archiveTdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.totalGross)}</td>
                      <td style={{ ...archiveTdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: s.totalNetProfit >= 0 ? '#00897b' : '#d32f2f' }}>{fmt(s.totalNetProfit)}</td>
                      <td style={archiveTdStyle}>{new Date(s.generatedAt).toLocaleString()}</td>
                      <td style={archiveTdStyle}>{s.generatedByName}</td>
                      <td style={archiveTdStyle}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewArchived(s.id); }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#fff', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

// ── Style helpers ─────────────────────────────────────────────
function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    background: active ? '#1976d2' : '#fff', color: active ? '#fff' : '#333',
    border: active ? '1px solid #1976d2' : '1px solid #ccc',
    borderRadius: 4, cursor: 'pointer',
  };
}

const archiveThStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0',
  fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#666',
  whiteSpace: 'nowrap', background: '#fafafa',
};

const archiveTdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem', borderBottom: '1px solid #f0f0f0',
  fontSize: '0.8125rem', whiteSpace: 'nowrap',
};
