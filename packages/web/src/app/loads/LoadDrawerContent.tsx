'use client';

import { useEffect, useState } from 'react';
import { LoadStatus, Role } from '@lol/shared';
import type { WeekDto, LoadDto, CreateLoadRequest, UpdateLoadRequest } from '@lol/shared';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { LoadForm, emptyFormData, type LoadFormData } from './LoadForm';
import { DrawerHeader, DrawerBody } from '@/components/Drawer';
import { ErrorBanner, LoadingBox } from '@/components/StateBoxes';
import { bannerStyle, tagStyle } from '@/lib/styles';

interface LoadDrawerContentProps {
  /** Load ID for edit mode, or null for create mode */
  loadId: string | null;
  /** Pre-selected week ID for new loads */
  weekId?: string;
  /** Called after successful save/create */
  onSaved: () => void;
  /** Called when user clicks close */
  onClose: () => void;
}

/**
 * Drawer content for creating or editing a load.
 * Reuses the existing LoadForm and API logic from NewLoadContent / EditLoadPage.
 */
export function LoadDrawerContent({ loadId, weekId, onSaved, onClose }: LoadDrawerContentProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const isEdit = !!loadId;

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LoadFormData | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);

  // ── Fetch data on mount ──────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function init() {
      try {
        if (isEdit) {
          // Edit mode: fetch load + weeks
          const [load, allWeeks] = await Promise.all([
            apiFetch<LoadDto>(`/loads/${loadId}`),
            apiFetch<WeekDto[]>('/weeks'),
          ]);
          if (cancelled) return;

          setWeeks(allWeeks);
          setIsArchived(!!load.archivedAt);
          setArchivedAt(load.archivedAt);
          setInitialData(
            emptyFormData({
              sylNumber: load.sylNumber,
              weekId: load.weekId,
              date: load.date,
              dispatcherId: load.dispatcherId,
              businessName: load.businessName,
              fromAddress: load.fromAddress,
              fromState: load.fromState,
              fromDate: load.fromDate,
              toAddress: load.toAddress,
              toState: load.toState,
              toDate: load.toDate,
              miles: String(load.miles),
              grossAmount: String(load.grossAmount),
              driverCostAmount: String(load.driverCostAmount),
              unitId: load.unitId || '',
              driverId: load.driverId || '',
              brokerageId: load.brokerageId || '',
              netsuiteRef: load.netsuiteRef || '',
              comment: load.comment || '',
              quickPayFlag: load.quickPayFlag,
              directPaymentFlag: load.directPaymentFlag,
              factoringFlag: load.factoringFlag,
              driverPaidFlag: load.driverPaidFlag,
              loadStatus: load.loadStatus,
            }),
          );
        } else {
          // Create mode: fetch weeks + current week
          const [current, allWeeks] = await Promise.all([
            apiFetch<WeekDto>('/weeks/current'),
            apiFetch<WeekDto[]>('/weeks'),
          ]);
          if (cancelled) return;

          setWeeks(allWeeks);
          const defaultWeekId = weekId || current.id;
          const defaultWeek = allWeeks.find((w) => w.id === defaultWeekId) || current;

          setInitialData(
            emptyFormData({
              weekId: defaultWeek.id,
              date: defaultWeek.startDate,
              fromDate: defaultWeek.startDate,
              toDate: defaultWeek.startDate,
              // Only pre-fill dispatcher if the current user IS a dispatcher;
              // otherwise leave blank so the EntityPicker shows the placeholder
              // instead of a raw UUID that doesn't match the picker list.
              dispatcherId: user!.role === Role.Dispatcher ? user!.id : '',
            }),
          );
        }
      } catch (err: unknown) {
        if (!cancelled) setInitError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user, loadId, weekId, isEdit]);

  // ── Create handler ──────────────────────────────────────
  async function handleCreate(data: LoadFormData) {
    const body: CreateLoadRequest = {
      sylNumber: data.sylNumber.trim(),
      weekId: data.weekId,
      date: data.date,
      dispatcherId: data.dispatcherId.trim(),
      businessName: data.businessName.trim(),
      fromAddress: data.fromAddress.trim(),
      fromState: data.fromState.trim(),
      fromDate: data.fromDate,
      toAddress: data.toAddress.trim(),
      toState: data.toState.trim(),
      toDate: data.toDate,
      miles: parseFloat(data.miles) || 0,
      grossAmount: parseFloat(data.grossAmount) || 0,
      driverCostAmount: parseFloat(data.driverCostAmount) || 0,
      ...(data.unitId.trim() ? { unitId: data.unitId.trim() } : {}),
      ...(data.driverId.trim() ? { driverId: data.driverId.trim() } : {}),
      ...(data.brokerageId.trim() ? { brokerageId: data.brokerageId.trim() } : {}),
      ...(data.netsuiteRef.trim() ? { netsuiteRef: data.netsuiteRef.trim() } : {}),
      ...(data.comment.trim() ? { comment: data.comment.trim() } : {}),
      quickPayFlag: data.quickPayFlag,
      directPaymentFlag: data.directPaymentFlag,
      factoringFlag: data.factoringFlag,
      driverPaidFlag: data.driverPaidFlag,
      loadStatus: data.loadStatus as LoadStatus,
    };

    await apiFetch('/loads', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    onSaved();
  }

  // ── Update handler ──────────────────────────────────────
  async function handleUpdate(data: LoadFormData) {
    const body: UpdateLoadRequest = {
      date: data.date,
      dispatcherId: data.dispatcherId.trim(),
      businessName: data.businessName.trim(),
      fromAddress: data.fromAddress.trim(),
      fromState: data.fromState.trim(),
      fromDate: data.fromDate,
      toAddress: data.toAddress.trim(),
      toState: data.toState.trim(),
      toDate: data.toDate,
      miles: parseFloat(data.miles) || 0,
      grossAmount: parseFloat(data.grossAmount) || 0,
      driverCostAmount: parseFloat(data.driverCostAmount) || 0,
      unitId: data.unitId.trim() || null,
      driverId: data.driverId.trim() || null,
      brokerageId: data.brokerageId.trim() || null,
      netsuiteRef: data.netsuiteRef.trim() || null,
      comment: data.comment.trim() || null,
      quickPayFlag: data.quickPayFlag,
      directPaymentFlag: data.directPaymentFlag,
      factoringFlag: data.factoringFlag,
      driverPaidFlag: data.driverPaidFlag,
      loadStatus: data.loadStatus as LoadStatus,
    };

    await apiFetch(`/loads/${loadId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    onSaved();
  }

  // ── Render ──────────────────────────────────────────────
  const drawerTitle = loading
    ? (isEdit ? t('drawer.loading') : t('drawer.newLoad'))
    : isEdit
      ? (isArchived ? `${t('drawer.viewLoad')} — ${initialData?.sylNumber || ''}` : `${t('drawer.editLoad')} — ${initialData?.sylNumber || ''}`)
      : t('drawer.newLoad');

  const drawerSubtitle = isArchived
    ? t('drawer.archivedReadOnly')
    : isEdit
      ? t('drawer.updateDetails')
      : t('drawer.createEntry');

  return (
    <>
      <DrawerHeader
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={onClose}
        tag={isArchived ? <span style={tagStyle('solidWarning')}>{t('table.archived')}</span> : undefined}
      />

      <DrawerBody>
        {loading ? (
          <LoadingBox message={isEdit ? t('drawer.loading') : t('drawer.preparingForm')} />
        ) : initError ? (
          <ErrorBanner message={initError} />
        ) : initialData ? (
          <>
            {isArchived && (
              <div style={{ ...bannerStyle('warning'), justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>
                  {t('drawer.archivedBanner')}
                </span>
              </div>
            )}
            <LoadForm
              initialData={initialData}
              weeks={weeks}
              onSubmit={isEdit ? handleUpdate : handleCreate}
              submitLabel={isEdit ? t('form.update') : t('form.create')}
              title=""
              isEdit={isEdit}
              readOnly={isArchived}
              onCancel={onClose}
            />
          </>
        ) : null}
      </DrawerBody>
    </>
  );
}
