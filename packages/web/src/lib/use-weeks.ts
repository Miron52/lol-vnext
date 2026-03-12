'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WeekDto } from '@lol/shared';
import { apiFetch } from './api';
import { getErrorMessage } from './errors';

interface UseWeeksResult {
  /** All available weeks, newest first. */
  weeks: WeekDto[];
  /** Currently selected week (defaults to current ISO week on first load). */
  selectedWeek: WeekDto | null;
  /** Switch selected week by id. */
  selectWeek: (weekId: string) => void;
  loading: boolean;
  error: string | null;
}

export function useWeeks(): UseWeeksResult {
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Fetch current week and all weeks in parallel
        const [current, all] = await Promise.all([
          apiFetch<WeekDto>('/weeks/current'),
          apiFetch<WeekDto[]>('/weeks'),
        ]);

        if (cancelled) return;

        setWeeks(all);
        setSelectedWeek(current);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const selectWeek = useCallback(
    (weekId: string) => {
      const found = weeks.find((w) => w.id === weekId);
      if (found) setSelectedWeek(found);
    },
    [weeks],
  );

  return { weeks, selectedWeek, selectWeek, loading, error };
}
