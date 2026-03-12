'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LoadDto } from '@lol/shared';
import { apiFetch } from './api';

interface UseLoadsResult {
  loads: LoadDto[];
  loading: boolean;
  error: string | null;
  /** Refetch loads for the current weekId. */
  refetch: () => void;
}

/**
 * Fetch loads for a given weekId.
 * Automatically refetches when weekId or includeArchived changes.
 * When includeArchived is true, the API returns both active and archived loads.
 */
export function useLoads(weekId: string | null, includeArchived = false): UseLoadsResult {
  const [loads, setLoads] = useState<LoadDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!weekId) {
      setLoads([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ weekId });
    if (includeArchived) params.set('includeArchived', 'true');

    apiFetch<LoadDto[]>(`/loads?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setLoads(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load loads');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [weekId, includeArchived, tick]);

  return { loads, loading, error, refetch };
}
