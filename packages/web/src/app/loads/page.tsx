'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n';
import { useWeeks } from '@/lib/use-weeks';
import { useLoads } from '@/lib/use-loads';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { WeekSwitcher } from './WeekSwitcher';
import { LoadsTable } from './LoadsTable';
import { ExportModal } from './ExportModal';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { Drawer } from '@/components/Drawer';
import { LoadDrawerContent } from './LoadDrawerContent';
import { primaryBtnStyle, navBtnStyle, checkboxLabelStyle, stickyToolbarStyle, toolbarGroupStyle, bannerStyle, colors, fontSizes } from '@/lib/styles';

export default function LoadsPage() {
  const { t } = useI18n();
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

  // ── Drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoadId, setDrawerLoadId] = useState<string | null>(null);

  const openNewLoadDrawer = useCallback(() => {
    setDrawerLoadId(null);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((loadId: string) => {
    setDrawerLoadId(loadId);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerLoadId(null);
  }, []);

  const handleDrawerSaved = useCallback(() => {
    closeDrawer();
    refetch();
  }, [closeDrawer, refetch]);

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
    return <main style={{ padding: '2rem' }}><LoadingBox message={t('common.authenticating')} /></main>;
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
      title="Loads"
      subtitle={selectedWeek ? `${selectedWeek.label} — ${selectedWeek.startDate} to ${selectedWeek.endDate}` : undefined}
    >

      {/* ── Sticky Toolbar ── */}
      <div style={stickyToolbarStyle}>
        {weeksLoading ? (
          <span style={{ color: colors.textMuted, fontSize: fontSizes.md }}>{t('loads.loadingWeeks')}</span>
        ) : weeksError ? (
          <span style={{ color: colors.danger, fontSize: fontSizes.md }}>
            Week load error: {weeksError}
          </span>
        ) : (
          <WeekSwitcher weeks={weeks} selectedWeek={selectedWeek} onSelect={selectWeek} />
        )}

        <div style={toolbarGroupStyle}>
          {canArchive && (
            <label style={{ ...checkboxLabelStyle, fontSize: fontSizes.base }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              {t('loads.showArchived')}
            </label>
          )}
          {canViewSalary && (
            <button
              onClick={() => router.push('/salary')}
              style={navBtnStyle}
            >
              {t('loads.salary')}
            </button>
          )}
          {canViewStatements && (
            <button
              onClick={() => router.push('/statements')}
              style={navBtnStyle}
            >
              {t('loads.statements')}
            </button>
          )}
          {canExport && (
            <button
              onClick={() => setExportOpen(true)}
              style={navBtnStyle}
            >
              {t('loads.exportCsv')}
            </button>
          )}
          <button
            onClick={openNewLoadDrawer}
            style={primaryBtnStyle}
          >
            {t('loads.newLoad')}
          </button>
        </div>
      </div>

      {/* ── Week info banner ── */}
      {selectedWeek && (
        <div style={{ ...bannerStyle('info'), justifyContent: 'space-between' }}>
          <span>
            <strong>{selectedWeek.label}</strong> &mdash; {selectedWeek.startDate} to {selectedWeek.endDate}
          </span>
          <span style={{ fontWeight: 500, fontSize: fontSizes.base }}>
            {loadsLoading ? t('loads.loading') : (
              showArchived
                ? `${activeCount} ${t('loads.active')}, ${archivedCount} ${t('loads.archived')}`
                : `${loads.length} ${loads.length !== 1 ? t('loads.loads') : t('loads.load')}`
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
        <LoadingBox message={t('loads.loading')} subtitle={t('loads.fetchingData')} />
      ) : loads.length === 0 ? (
        <EmptyBox
          title={t('loads.noLoads')}
          subtitle={t('loads.noLoadsHint')}
          actionLabel={t('loads.newLoad')}
          onAction={openNewLoadDrawer}
        />
      ) : (
        <LoadsTable
          loads={loads}
          onEdit={openEditDrawer}
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
      {/* ── Load drawer ── */}
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <LoadDrawerContent
          loadId={drawerLoadId}
          weekId={selectedWeek?.id}
          onSaved={handleDrawerSaved}
          onClose={closeDrawer}
        />
      </Drawer>
    </PageShell>
  );
}
