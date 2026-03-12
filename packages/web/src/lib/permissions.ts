'use client';

import { useMemo } from 'react';
import { Role, Action, can, canAny } from '@lol/shared';
import { useAuth } from './auth';

/**
 * Hook that exposes permission checks bound to the current user's role.
 * Returns stable helpers that can be called inline.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  return useMemo(
    () => ({
      /** Check a single action. Returns false when not authenticated. */
      can: (action: Action): boolean => (role ? can(role, action) : false),
      /** Check if any of the given actions are allowed. */
      canAny: (actions: Action[]): boolean => (role ? canAny(role, actions) : false),
      role: role ?? null,
    }),
    [role],
  );
}
