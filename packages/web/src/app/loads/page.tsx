'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useWeeks } from '@/lib/use-weeks';
import { useLoads } from '@/lib/use-loads';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { WeekSwitcher } from './WeekSwitcher';
import { LoadsTable } from './LoadsTable';
import { ExportModal } from './ExportModal';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { primaryBtnStyle, navBtnStyle, checkboxLabelStyle } from '@/lib/styles';

export default function LoadsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const canArchive = allowed(Action.LoadsArchive);
  const canExport = allowed(Action.LoadsExport);
  const canViewSalary = allowed(Action.SalaryPreview);
  const canViewStatements = allowed(Action.StatementsRead);
  const { weeks, selectedWeek, selectWeek, loading: weeksLoading, error: weeksError } = useWeeks();
  const [showArchived, setShowArchived] = useState(false);
  const { loads, loading: loadsLoading, error: loadsError, refetch } = useLoads(
    selectedWeek?.id ?? null,
    showArchived,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Archive / Unarchive handlers ──
  const handleArchive = useCallback(async (loadId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/loads/${loadId}/archive`, { method: 'POST' });
      refetch();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    }
  }, [refetch]);

  const handleUnarchive = useCallback(async (loadId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/loads/${loadId}/unarchive`, { method: 'POST' });
      refetch();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    }
  }, [refetch]);

  if (authLoading) {
    return <main style={{ padding: '2rem' }}>Loading...</main>;
  }

  if (!user) {
    return null; // redirecting
  }

  const activeCount = loads.filter((l) => !l.archivedAt).length;
  const archivedCount = loads.filter((l) => !!l.archivedAt).length;

  // ── Render ──────────────────────────────────────────────────
  return (
    <PageShell
      breadcrumb="/ List of Loads"
      user={user}
      onLogout={logout}
      nav={[{label:'Home',href:'/'}]}
    >

      {/* ── Toolbar: week switcher + create button ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {weeksLoading ? (
          <span style={{ color: '#888', fontSize: '0.875rem' }}>Loading weeks...</span>
        ) : weeksError ? (
          <span style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
            Week load error: {weeksError}
          </span>
        ) : (
          <WeekSwitcher weeks={weeks} selectedWeek={selectedWeek} onSelect={selectWeek} />
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {canArchive && (
            <label style={{ ...checkboxLabelStyle, fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show Archived
            </label>
          )}
          {canViewSalary && (
            <button
              onClick={() => router.push('/salary')}
              style={navBtnStyle}
            >
              Salary
            </button>
          )}
          {canViewStatements && (
            <button
              onClick={() => router.push('/statements')}
              style={navBtnStyle}
            >
              Statements
            </button>
          )}
          {canExport && (
            <button
              onClick={() => setExportOpen(true)}
              style={navBtnStyle}
            >
              Export CSV
            </button>
          )}
          <button
            onClick={() => {
              router.push(`/loads/new${selectedWeek ? `?weekId=${selectedWeek.id}` : ''}`);
            }}
            style={primaryBtnStyle}
          >
            + New Load
          </button>
        </div>
      </div>

      {/* ── Week info banner ── */}
      {selectedWeek && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: '#f5f9ff',
            borderRadius: 4,
            fontSize: '0.8125rem',
            color: '#444',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>
            <strong>{selectedWeek.label}</strong> &mdash; {selectedWeek.startDate} to {selectedWeek.endDate}
          </span>
          <span>
            {loadsLoading ? 'Loading...' : (
              showArchived
                ? `${activeCount} active, ${archivedCount} archived`
                : `${loads.length} load${loads.length !== 1 ? 's' : ''}`
            )}
          </span>
        </div>
      )}

      {/* ── Error banners ── */}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* ── Content area ── */}
      {loadsError ? (
        <ErrorBanner message={loadsError} />
      ) : loadsLoading ? (
        <LoadingBox message="Loading loads..." />
      ) : loads.length === 0 ? (
        <EmptyBox title="No loads this week" subtitle="Create a new load or switch to a different week." />
      ) : (
        <LoadsTable
          loads={loads}
          onEdit={(loadId) => router.push(`/loads/${loadId}/edit`)}
          onArchive={canArchive ? handleArchive : undefined}
          onUnarchive={canArchive ? handleUnarchive : undefined}
        />
      )}
      {/* ── Export modal ── */}
      {exportOpen && (
        <ExportModal
          weeks={weeks}
          selectedWeekId={selectedWeek?.id ?? ''}
          onClose={() => setExportOpen(false)}
        />
      )}
    </PageShell>
  );
}
