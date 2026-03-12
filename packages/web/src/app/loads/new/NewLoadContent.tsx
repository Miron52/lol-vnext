'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_NAME, LoadStatus } from '@lol/shared';
import type { WeekDto, CreateLoadRequest } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { apiFetch } from '@/lib/api';
import { LoadForm, emptyFormData, type LoadFormData } from '../LoadForm';

export function NewLoadContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedWeekId = searchParams.get('weekId');

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LoadFormData | null>(null);

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Load weeks + set defaults ─────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function init() {
      try {
        const [current, allWeeks] = await Promise.all([
          apiFetch<WeekDto>('/weeks/current'),
          apiFetch<WeekDto[]>('/weeks'),
        ]);
        if (cancelled) return;

        setWeeks(allWeeks);

        const defaultWeekId = preselectedWeekId || current.id;
        const defaultWeek = allWeeks.find((w) => w.id === defaultWeekId) || current;

        setInitialData(
          emptyFormData({
            weekId: defaultWeek.id,
            date: defaultWeek.startDate,
            fromDate: defaultWeek.startDate,
            toDate: defaultWeek.startDate,
            dispatcherId: user!.id,
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
  }, [user, preselectedWeekId]);

  // ── Submit handler ────────────────────────────────────────
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
      // optional fields — only send if non-empty
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
          <span style={{ color: '#888', fontSize: '0.875rem' }}>/ New Load</span>
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

      <LoadForm
        initialData={initialData}
        weeks={weeks}
        onSubmit={handleCreate}
        submitLabel="Create Load"
        title="New Load"
      />
    </main>
  );
}
