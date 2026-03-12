'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { APP_NAME, LoadStatus } from '@lol/shared';
import type { WeekDto, LoadDto, UpdateLoadRequest } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { LoadForm, emptyFormData, type LoadFormData } from '../../LoadForm';

export default function EditLoadPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const loadId = params.id;

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LoadFormData | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Fetch existing load + weeks ───────────────────────────
  useEffect(() => {
    if (!user || !loadId) return;

    let cancelled = false;

    async function init() {
      try {
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
      } catch (err: unknown) {
        if (!cancelled) setInitError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user, loadId]);

  // ── Submit handler ────────────────────────────────────────
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

    router.push('/loads');
  }

  // ── Render ────────────────────────────────────────────────
  if (authLoading || loading) {
    return <main style={{ padding: '2rem' }}>Loading...</main>;
  }

  if (!user) return null;

  if (initError) {
    return (
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ color: '#d32f2f', padding: '1rem', background: '#fff5f5', borderRadius: 6 }}>
          {initError}
        </div>
      </main>
    );
  }

  if (!initialData) return null;

  return (
    <main style={{ padding: '1.5rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{APP_NAME}</h1>
          <span style={{ color: '#888', fontSize: '0.875rem' }}>
            / {isArchived ? 'View Load (Archived)' : 'Edit Load'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/loads')}
            style={{
              padding: '0.375rem 0.75rem',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            Back to Loads
          </button>
          <button
            onClick={logout}
            style={{
              padding: '0.375rem 0.75rem',
              background: '#eee',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Archived banner ── */}
      {isArchived && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: '#fff8e1',
          border: '1px solid #ffb74d',
          borderRadius: 6,
          fontSize: '0.8125rem',
          color: '#e65100',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>
            This load is archived{archivedAt ? ` (since ${new Date(archivedAt).toLocaleDateString()})` : ''} and is read-only. Unarchive it from the Loads list to make changes.
          </span>
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: '0.6875rem',
            fontWeight: 700,
            background: '#ff9800',
            color: '#fff',
          }}>
            ARCHIVED
          </span>
        </div>
      )}

      {isArchived ? (
        <LoadForm
          initialData={initialData}
          weeks={weeks}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          title={`View Load — ${initialData.sylNumber}`}
          isEdit
          readOnly
        />
      ) : (
        <LoadForm
          initialData={initialData}
          weeks={weeks}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          title={`Edit Load — ${initialData.sylNumber}`}
          isEdit
        />
      )}
    </main>
  );
}
