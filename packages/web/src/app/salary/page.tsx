'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { SalaryRowDto, SalaryWeekStateDto, SalaryAuditLogDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useWeeks } from '@/lib/use-weeks';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { thStyle, tdStyle, smallBtnStyle, fmt, fmtDate } from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { PageShell } from '@/components/PageShell';
import { WeekSwitcher } from '../loads/WeekSwitcher';
import { AdjustmentModal } from './AdjustmentModal';

type Filter = 'all' | 'with_salary' | 'no_salary';

export default function SalaryPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const { weeks, selectedWeek, selectWeek, loading: weeksLoading, error: weeksError } = useWeeks();

  const canMutate = allowed(Action.SalaryGenerate);

  const [rows, setRows] = useState<SalaryRowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Week state
  const [weekState, setWeekState] = useState<SalaryWeekStateDto | null>(null);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<SalaryAuditLogDto[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  // Adjustment modal state
  const [adjustTarget, setAdjustTarget] = useState<SalaryRowDto | null>(null);

  // Generating state (per-dispatcher)
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  // Action-in-progress (freeze, unfreeze, recalculate)
  const [actionLoading, setActionLoading] = useState(false);

  const isFrozen = weekState?.status === 'frozen';

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Fetch salary preview + week state ──
  const fetchPreview = useCallback(async (weekId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [data, state] = await Promise.all([
        apiFetch<SalaryRowDto[]>(`/salary/preview?weekId=${weekId}`),
        apiFetch<SalaryWeekStateDto>(`/salary/week-state?weekId=${weekId}`),
      ]);
      setRows(data);
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWeek) fetchPreview(selectedWeek.id);
  }, [selectedWeek, fetchPreview]);

  // ── Fetch audit log ──
  const fetchAuditLog = useCallback(async (weekId: string) => {
    try {
      const logs = await apiFetch<SalaryAuditLogDto[]>(`/salary/audit-log?weekId=${weekId}`);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    }
  }, []);

  useEffect(() => {
    if (showAudit && selectedWeek) fetchAuditLog(selectedWeek.id);
  }, [showAudit, selectedWeek, fetchAuditLog]);

  // ── Filtered & searched rows ──
  const filteredRows = useMemo(() => {
    let result = rows;
    if (filter === 'with_salary') result = result.filter((r) => r.isGenerated);
    if (filter === 'no_salary') result = result.filter((r) => !r.isGenerated);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.dispatcherName.toLowerCase().includes(q));
    }
    return result;
  }, [rows, filter, search]);

  // ── Summary totals ──
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        profit: acc.profit + r.weeklyGrossProfit,
        base: acc.base + r.baseSalary,
        other: acc.other + r.totalOther,
        bonus: acc.bonus + r.totalBonus,
        total: acc.total + r.totalSalary,
      }),
      { profit: 0, base: 0, other: 0, bonus: 0, total: 0 },
    );
  }, [filteredRows]);

  // ── Handlers ──
  const handleGenerate = async (row: SalaryRowDto) => {
    if (generating.has(row.dispatcherId) || isFrozen) return;
    setGenerating((prev) => new Set(prev).add(row.dispatcherId));
    try {
      await apiFetch<SalaryRowDto>('/salary/generate', {
        method: 'POST',
        body: JSON.stringify({
          weekId: row.weekId,
          dispatcherId: row.dispatcherId,
          adjustments: row.adjustments,
        }),
      });
      if (selectedWeek) await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(row.dispatcherId);
        return next;
      });
    }
  };

  const handleAdjustSave = async (adjustments: { type: 'other' | 'bonus'; amount: number; note: string }[]) => {
    if (!adjustTarget || !selectedWeek) return;
    const targetId = adjustTarget.dispatcherId;
    setAdjustTarget(null);
    setGenerating((prev) => new Set(prev).add(targetId));
    try {
      await apiFetch<SalaryRowDto>('/salary/generate', {
        method: 'POST',
        body: JSON.stringify({
          weekId: selectedWeek.id,
          dispatcherId: targetId,
          adjustments,
        }),
      });
      await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const handleRecalculate = async () => {
    if (!selectedWeek || actionLoading || isFrozen) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch('/salary/recalculate', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!selectedWeek || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const state = await apiFetch<SalaryWeekStateDto>('/salary/freeze', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!selectedWeek || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const state = await apiFetch<SalaryWeekStateDto>('/salary/unfreeze', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) return <main style={{ padding: '2rem' }}>Loading...</main>;
  if (!user) return null;

  if (!allowed(Action.SalaryPreview)) {
    return (
      <PageShell breadcrumb="/ Salary" user={user} onLogout={logout} nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}>
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
            You do not have permission to view salary data. Contact an administrator if you need access.
          </p>
        </div>
      </PageShell>
    );
  }

  const statusColor: Record<string, { bg: string; fg: string; label: string }> = {
    open: { bg: '#fff8e1', fg: '#f57f17', label: 'Open' },
    generated: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Generated' },
    frozen: { bg: '#e3f2fd', fg: '#0d47a1', label: 'Frozen' },
  };
  const st = statusColor[weekState?.status ?? 'open'];

  return (
    <PageShell
      breadcrumb="/ Salary"
      user={user}
      onLogout={logout}
      nav={[
        { label: 'Home', href: '/' },
        { label: 'Loads', href: '/loads' },
        { label: 'Settings', href: '/settings' },
      ]}
    >
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {weeksLoading ? (
          <span style={{ color: '#888', fontSize: '0.875rem' }}>Loading weeks...</span>
        ) : weeksError ? (
          <span style={{ color: '#d32f2f', fontSize: '0.875rem' }}>Week load error: {weeksError}</span>
        ) : (
          <WeekSwitcher weeks={weeks} selectedWeek={selectedWeek} onSelect={selectWeek} />
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{ padding: '0.375rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem', width: 180 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            style={{ padding: '0.375rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem', background: '#fff' }}
          >
            <option value="all">All</option>
            <option value="with_salary">With Salary</option>
            <option value="no_salary">No Salary</option>
          </select>
        </div>
      </div>

      {/* ── Week state banner ── */}
      {selectedWeek && weekState && (
        <div style={{
          padding: '0.625rem 0.75rem',
          background: st.bg,
          borderRadius: 4,
          fontSize: '0.8125rem',
          color: '#444',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: `1px solid ${st.fg}33`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>
              <strong>{selectedWeek.label}</strong> &mdash; {selectedWeek.startDate} to {selectedWeek.endDate}
            </span>
            <span style={{
              display: 'inline-block',
              padding: '0.125rem 0.625rem',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: st.fg,
              color: '#fff',
            }}>
              {st.label}
            </span>
            {weekState.generatedByName && (
              <span style={{ fontSize: '0.75rem', color: '#666' }}>
                Generated by {weekState.generatedByName}
                {weekState.generatedAt && ` on ${fmtDate(weekState.generatedAt)}`}
              </span>
            )}
            {weekState.frozenByName && (
              <span style={{ fontSize: '0.75rem', color: '#666' }}>
                | Frozen by {weekState.frozenByName}
                {weekState.frozenAt && ` on ${fmtDate(weekState.frozenAt)}`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: '#666', marginRight: '0.5rem' }}>
              {loading ? 'Loading...' : `${rows.length} dispatcher${rows.length !== 1 ? 's' : ''}`}
            </span>

            {/* Recalculate — only when generated (not frozen, not open), admin/accountant only */}
            {canMutate && weekState.status === 'generated' && (
              <button
                onClick={handleRecalculate}
                disabled={actionLoading}
                style={{
                  ...actionBtnStyle,
                  background: actionLoading ? '#e0e0e0' : '#ff9800',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {actionLoading ? '...' : 'Recalculate'}
              </button>
            )}

            {/* Freeze — only when generated, admin/accountant only */}
            {canMutate && weekState.status === 'generated' && (
              <button
                onClick={handleFreeze}
                disabled={actionLoading}
                style={{
                  ...actionBtnStyle,
                  background: actionLoading ? '#e0e0e0' : '#0d47a1',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {actionLoading ? '...' : 'Freeze'}
              </button>
            )}

            {/* Unfreeze — only when frozen, admin/accountant only */}
            {canMutate && weekState.status === 'frozen' && (
              <button
                onClick={handleUnfreeze}
                disabled={actionLoading}
                style={{
                  ...actionBtnStyle,
                  background: actionLoading ? '#e0e0e0' : '#d32f2f',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {actionLoading ? '...' : 'Unfreeze'}
              </button>
            )}

            {/* Audit log toggle */}
            <button
              onClick={() => setShowAudit(!showAudit)}
              style={{
                ...actionBtnStyle,
                background: showAudit ? '#333' : '#fff',
                color: showAudit ? '#fff' : '#333',
                border: '1px solid #ccc',
              }}
            >
              Audit Log
            </button>
          </div>
        </div>
      )}

      {/* ── Frozen notice ── */}
      {isFrozen && (
        <div style={{
          padding: '0.5rem 0.75rem',
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: 4,
          marginBottom: '1rem',
          fontSize: '0.8125rem',
          color: '#0d47a1',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{
            display: 'inline-block',
            padding: '1px 8px',
            borderRadius: 3,
            fontSize: '0.625rem',
            fontWeight: 700,
            background: '#0d47a1',
            color: '#fff',
          }}>
            READ ONLY
          </span>
          <span>
            This week is frozen. Generate, recalculate, and adjustment actions are disabled. Unfreeze to make changes.
          </span>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Audit log panel ── */}
      {showAudit && (
        <div style={{
          marginBottom: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          background: '#fafafa',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e0e0e0', fontWeight: 600, fontSize: '0.8125rem', background: '#f5f5f5' }}>
            Audit Log — {selectedWeek?.label}
          </div>
          {auditLogs.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.8125rem' }}>
              No audit entries for this week.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '0.375rem 0.75rem', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '0.375rem 0.75rem', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '0.375rem 0.75rem', fontWeight: 600 }}>By</th>
                  <th style={{ padding: '0.375rem 0.75rem', fontWeight: 600 }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(log.createdAt)}</td>
                    <td style={{ padding: '0.375rem 0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.0625rem 0.375rem',
                        borderRadius: 4,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        background: auditActionColor[log.action]?.bg ?? '#eee',
                        color: auditActionColor[log.action]?.fg ?? '#333',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.375rem 0.75rem' }}>{log.performedByName}</td>
                    <td style={{ padding: '0.375rem 0.75rem', color: '#555' }}>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <LoadingBox message="Loading salary data..." />
      ) : rows.length === 0 ? (
        <EmptyBox title="No salary data" subtitle="No dispatchers with loads found for this week, or no active salary rule configured." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={thStyle}>Dispatcher</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross Profit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Base Salary</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Other</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Bonus</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Loads</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.dispatcherId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{r.dispatcherName}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(r.weeklyGrossProfit)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.appliedPercent}%</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(r.baseSalary)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: r.totalOther !== 0 ? '#7b1fa2' : '#ccc' }}>
                    ${fmt(r.totalOther)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: r.totalBonus !== 0 ? '#2e7d32' : '#ccc' }}>
                    ${fmt(r.totalBonus)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    ${fmt(r.totalSalary)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{r.loadCount}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: r.isGenerated ? '#e8f5e9' : '#fff8e1',
                      color: r.isGenerated ? '#2e7d32' : '#f57f17',
                    }}>
                      {r.isGenerated ? 'Generated' : 'Pending'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {canMutate && (
                        <button
                          onClick={() => !isFrozen && setAdjustTarget(r)}
                          disabled={isFrozen}
                          style={{
                            ...smallBtnStyle,
                            opacity: isFrozen ? 0.5 : 1,
                            cursor: isFrozen ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Adjust
                        </button>
                      )}
                      {canMutate && !r.isGenerated && (
                        <button
                          onClick={() => handleGenerate(r)}
                          disabled={generating.has(r.dispatcherId) || isFrozen}
                          style={{
                            ...smallBtnStyle,
                            background: (generating.has(r.dispatcherId) || isFrozen) ? '#e0e0e0' : '#1976d2',
                            color: '#fff',
                            border: 'none',
                            cursor: isFrozen ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {generating.has(r.dispatcherId) ? '...' : 'Generate'}
                        </button>
                      )}
                      {r.isGenerated && r.id && (
                        <button
                          onClick={() => router.push(`/salary/${r.id}`)}
                          style={{ ...smallBtnStyle, color: '#1976d2' }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* ── Totals row ── */}
            <tfoot>
              <tr style={{ background: '#f9f9f9', fontWeight: 600, borderTop: '2px solid #ddd' }}>
                <td style={tdStyle}>Totals ({filteredRows.length})</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totals.profit)}</td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totals.base)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totals.other)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totals.bonus)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totals.total)}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Adjustment modal ── */}
      {adjustTarget && (
        <AdjustmentModal
          dispatcherName={adjustTarget.dispatcherName}
          existingAdjustments={adjustTarget.adjustments}
          onSave={handleAdjustSave}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </PageShell>
  );
}

// ── Audit action colors ──
const auditActionColor: Record<string, { bg: string; fg: string }> = {
  generate: { bg: '#e8f5e9', fg: '#2e7d32' },
  recalculate: { bg: '#fff3e0', fg: '#e65100' },
  freeze: { bg: '#e3f2fd', fg: '#0d47a1' },
  unfreeze: { bg: '#fce4ec', fg: '#c62828' },
  adjustment: { bg: '#f3e5f5', fg: '#6a1b9a' },
};

// ── Styles ──

const actionBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.625rem',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 600,
};
